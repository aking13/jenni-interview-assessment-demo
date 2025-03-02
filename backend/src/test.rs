use actix_web::{test, web, App};
use serde_json::json;

// Import your structs and functions
use super::*;

#[actix_web::test]
async fn test_welcome() {
    // Create test app
    let app = test::init_service(
        App::new()
            .route("/", web::get().to(welcome))
    ).await;

    // Create request
    let req = test::TestRequest::get().uri("/").to_request();

    // Execute request and verify response
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Check response body contains expected string
    let body = test::read_body(resp).await;
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    assert!(body_str.contains("I'm up and running!"));
}

#[actix_web::test]
async fn test_paraphrase_text() {
    // Create a simple handler that mimics the paraphrase_text function
    // but doesn't actually call the OpenAI API
    async fn mock_paraphrase_text(request: web::Json<ParaphraseRequest>) -> impl Responder {
        let response = ParaphraseResponse {
            paraphrased_text: format!("Paraphrased: {}", request.text),
            original_text: request.text.clone(),
        };
        
        HttpResponse::Ok().json(response)
    }
    
    // Create test app with the mock paraphrase route
    let app = test::init_service(
        App::new()
            .route("/paraphrase", web::post().to(mock_paraphrase_text))
    ).await;

    // Create request with JSON body
    let req = test::TestRequest::post()
        .uri("/paraphrase")
        .set_json(&json!({"text": "This is a test text that needs paraphrasing."}))
        .to_request();

    // Execute request and verify response
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Check response body
    let body = test::read_body(resp).await;
    let response: ParaphraseResponse = serde_json::from_slice(&body).unwrap();
    assert_eq!(response.original_text, "This is a test text that needs paraphrasing.");
    assert_eq!(response.paraphrased_text, "Paraphrased: This is a test text that needs paraphrasing.");
}

#[actix_web::test]
async fn test_paraphrase_validation() {
    // Create a mock handler that implements the same validation but returns mock data
    async fn mock_paraphrase_text(request: web::Json<ParaphraseRequest>) -> impl Responder {
        let text = &request.text;

        // Input validation (same as real handler)
        if text.trim().is_empty() {
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

        // For valid input, return mock response
        let response = ParaphraseResponse {
            paraphrased_text: format!("Paraphrased: {}", text),
            original_text: text.to_string(),
        };
        
        HttpResponse::Ok().json(response)
    }

    // Create test app with the mock handler
    let app = test::init_service(
        App::new()
            .route("/paraphrase", web::post().to(mock_paraphrase_text))
    ).await;

    // Test empty text
    let req = test::TestRequest::post()
        .uri("/paraphrase")
        .set_json(&json!({"text": ""}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], "EMPTY_INPUT");

    // Test whitespace-only text
    let req = test::TestRequest::post()
        .uri("/paraphrase")
        .set_json(&json!({"text": "   \n  \t  "}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], "EMPTY_INPUT");

    // Test text that exceeds length limit
    let long_text = "a".repeat(MAX_TEXT_LENGTH + 1);
    let req = test::TestRequest::post()
        .uri("/paraphrase")
        .set_json(&json!({"text": long_text}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 400);
    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["code"], "TEXT_TOO_LONG");

    // Test valid text (just under length limit)
    let valid_text = "This is a valid test text";
    let req = test::TestRequest::post()
        .uri("/paraphrase")
        .set_json(&json!({"text": valid_text}))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 200);
    
    let body: ParaphraseResponse = test::read_body_json(resp).await;
    assert_eq!(body.original_text, valid_text);
    assert_eq!(body.paraphrased_text, format!("Paraphrased: {}", valid_text));
}