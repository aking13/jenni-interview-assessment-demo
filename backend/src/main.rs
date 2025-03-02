//! # Paraphrasing Service
//! 
//! A web service that provides text paraphrasing functionality using OpenAI's API.
//! The service exposes two endpoints:
//! - `/`: A simple welcome endpoint that returns a greeting message
//! - `/paraphrase`: An endpoint that accepts text and returns a paraphrased version

use actix_web::{web, HttpResponse, Responder};
use actix_web::http::header;
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use rand::random;
use log::{info, debug, error};
use reqwest::Client;
use std::env;
use serde_json::json;

//-----------------------------------------------------------------------------
// Data Structures
//-----------------------------------------------------------------------------

/// Request payload for the paraphrase endpoint
#[derive(Deserialize)]
struct ParaphraseRequest {
    text: String,
}

/// Response payload for the paraphrase endpoint
#[derive(Serialize, Deserialize)]
struct ParaphraseResponse {
    #[serde(rename = "paraphrasedText")]
    paraphrased_text: String,
    #[serde(rename = "originalText")]
    original_text: String,
}

/// Request payload for the OpenAI API
#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
}

/// Message structure for OpenAI API requests
#[derive(Serialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

/// Response structure from OpenAI API
#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

/// Choice structure within OpenAI API responses
#[derive(Deserialize)]
struct OpenAIChoice {
    message: OpenAIResponseMessage,
}

/// Message structure within OpenAI API response choices
#[derive(Deserialize)]
struct OpenAIResponseMessage {
    content: String,
}

//-----------------------------------------------------------------------------
// API Handlers
//-----------------------------------------------------------------------------

// Constants for input validation
const MAX_TEXT_LENGTH: usize = 5000;  // 5000 characters should be reasonable for most use cases

/// Handles requests to the paraphrase endpoint
///
/// Accepts text input and returns a paraphrased version using OpenAI's API
async fn paraphrase_text(request: web::Json<ParaphraseRequest>) -> impl Responder {
    let text = request.text.trim();  // Manual trimming

    // Input validation
    if text.is_empty() {
        return HttpResponse::BadRequest().json(json!({
            "error": "Text cannot be empty",
            "code": "EMPTY_INPUT"
        }));
    }

    if text.len() > MAX_TEXT_LENGTH {
        return HttpResponse::BadRequest().json(json!({
            "error": format!("Text too long (max {} characters)", MAX_TEXT_LENGTH),
            "code": "TEXT_TOO_LONG"
        }));
    }

    info!("Processing text of length: {}", text.len());
    
    // Load OpenAI API key from environment variables
    let api_key = match get_openai_api_key() {
        Ok(key) => key,
        Err(response) => return response,
    };
    
    // Create and send request to OpenAI API
    let client = Client::new();
    let openai_request = create_openai_request(text);
    
    info!("Sending request to OpenAI API");
    let result = send_openai_request(&client, &api_key, &openai_request).await;
    
    // Process response from OpenAI API
    match result {
        Ok(response) => {
            if response.status().is_success() {
                process_successful_response(response, text).await
            } else {
                error!("OpenAI API returned error status: {}", response.status());
                HttpResponse::InternalServerError().json(json!({
                    "error": "OpenAI API returned an error",
                    "code": "API_ERROR"
                }))
            }
        },
        Err(e) => {
            error!("Failed to send request to OpenAI API: {}", e);
            HttpResponse::InternalServerError().json(json!({
                "error": "Failed to connect to OpenAI API",
                "code": "CONNECTION_ERROR"
            }))
        }
    }
}

/// Welcome endpoint handler
///
/// Returns a simple greeting message with a random number
async fn welcome() -> impl Responder {
    let random_number: i32 = random();
    info!("Welcome endpoint called, generated random number: {}", random_number);
    HttpResponse::Ok().body(format!("I'm up and running! My favorite number is {}", random_number))
}

//-----------------------------------------------------------------------------
// Helper Functions
//-----------------------------------------------------------------------------

/// Retrieves the OpenAI API key from Secrets.toml
fn get_openai_api_key() -> Result<String, HttpResponse> {
    // Try to read from Secrets.toml
    let secrets_paths = vec![
        "Secrets.toml",
        "backend/Secrets.toml",
        "../Secrets.toml",
    ];
    
    for path in secrets_paths {
        if let Ok(contents) = std::fs::read_to_string(path) {
            // Simple parsing for OPENAI_API_KEY='value'
            for line in contents.lines() {
                if line.starts_with("OPENAI_API_KEY=") {
                    let parts: Vec<&str> = line.splitn(2, '=').collect();
                    if parts.len() == 2 {
                        let value = parts[1].trim();
                        // Remove surrounding quotes if present
                        let key = value.trim_matches(|c| c == '\'' || c == '"');
                        return Ok(key.to_string());
                    }
                }
            }
        }
    }
    
    // If we get here, the key wasn't found
    error!("OPENAI_API_KEY not found in Secrets.toml");
    Err(HttpResponse::InternalServerError().body("OpenAI API key not configured in Secrets.toml"))
}

/// Creates an OpenAI API request for paraphrasing the given text
fn create_openai_request(text: &str) -> OpenAIRequest {
    OpenAIRequest {
        model: "gpt-4o-mini".to_string(),
        messages: vec![
            OpenAIMessage {
                role: "system".to_string(),
                content: "You are a helpful assistant that paraphrases text. Provide only the paraphrased version of the text without any additional explanation.".to_string(),
            },
            OpenAIMessage {
                role: "user".to_string(),
                content: format!("Please paraphrase the following text: {}", text),
            },
        ],
        temperature: 0.7,
    }
}

/// Sends a request to the OpenAI API
async fn send_openai_request(
    client: &Client, 
    api_key: &str, 
    request: &OpenAIRequest
) -> Result<reqwest::Response, reqwest::Error> {
    client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(request)
        .send()
        .await
}

/// Processes a successful response from the OpenAI API
async fn process_successful_response(
    response: reqwest::Response, 
    original_text: &str
) -> HttpResponse {
    match response.json::<OpenAIResponse>().await {
        Ok(openai_response) => {
            if let Some(choice) = openai_response.choices.first() {
                let paraphrased_text = choice.message.content.clone();
                info!("Successfully received paraphrased text from OpenAI");
                
                let response = ParaphraseResponse {
                    paraphrased_text,
                    original_text: original_text.to_string(),
                };
                
                HttpResponse::Ok().json(response)
            } else {
                error!("No choices returned from OpenAI API");
                HttpResponse::InternalServerError().body("Failed to get paraphrased text from OpenAI")
            }
        },
        Err(e) => {
            error!("Failed to parse OpenAI API response: {}", e);
            HttpResponse::InternalServerError().body("Failed to parse OpenAI API response")
        }
    }
}

//-----------------------------------------------------------------------------
// Application Entry Point
//-----------------------------------------------------------------------------

/// Main entry point for the Shuttle runtime
#[shuttle_runtime::main]
async fn shuttle_main() -> shuttle_actix_web::ShuttleActixWeb<impl Fn(&mut web::ServiceConfig) + Send + Clone + 'static> {
    info!("Initializing application...");

    let app = move |cfg: &mut web::ServiceConfig| {
        // Configure CORS to allow requests from any origin
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["GET", "POST"])
            .allowed_header(header::CONTENT_TYPE)
            .max_age(3600);
            
        debug!("Configuring CORS and routes");
        cfg.service(
            web::scope("")
                .wrap(cors)
                .route("/", web::get().to(welcome))
                .route("/paraphrase", web::post().to(paraphrase_text))
        );
        info!("Routes configured successfully");
    };

    info!("Server initialization complete");
    Ok(app.into())
}

#[cfg(test)]
mod test;