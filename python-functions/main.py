"""
Python Cloud Function for PDF Table Extraction - NVR Focus
Integrates the existing extract_pdf_tables.py script into Google Cloud Functions
"""

import json
import tempfile
import os
import sys
from pathlib import Path

# Import Cloud Functions framework
from functions_framework import http
from google.cloud import storage
import requests

# Add the current directory to Python path to import our extraction script
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

# Import our NVR extraction logic
from extract_pdf_tables import NVRPDFExtractor


@http
def extractPdfTables(request):
    """
    HTTP Cloud Function for extracting tables from PDF files
    
    Expected request body:
    {
        "fileUrl": "gs://bucket/path/to/file.pdf",
        "documentType": "NVR",
        "extractionId": "unique-id"
    }
    """
    
    try:
        # Parse request
        request_json = request.get_json(silent=True)
        if not request_json:
            return {'error': 'No JSON body provided'}, 400
            
        file_url = request_json.get('fileUrl')
        document_type = request_json.get('documentType', 'NVR')
        extraction_id = request_json.get('extractionId', 'default')
        
        if not file_url:
            return {'error': 'fileUrl is required'}, 400
            
        print(f"Processing PDF extraction request: {file_url}")
        print(f"Document type: {document_type}")
        print(f"Extraction ID: {extraction_id}")
        
        # Download file from Firebase Storage or HTTP URL
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_path = temp_file.name
            
            try:
                if file_url.startswith('gs://'):
                    # Download from Google Cloud Storage
                    download_from_gcs(file_url, temp_path)
                elif file_url.startswith('http'):
                    # Download from HTTP URL
                    download_from_url(file_url, temp_path)
                else:
                    return {'error': 'Unsupported file URL format'}, 400
                
                print(f"Downloaded PDF to: {temp_path}")
                print(f"File size: {os.path.getsize(temp_path)} bytes")
                
                # Extract tables using our proven NVR extractor
                with NVRPDFExtractor(temp_path, document_type) as extractor:
                    tables = extractor.extract_nvr_tables()
                
                print(f"Extracted {len(tables)} tables")
                
                # Prepare response in Cloud Function format
                result = {
                    "extractionId": extraction_id,
                    "status": "completed",
                    "tables": tables,
                    "metadata": {
                        "extractor_version": "2.1.0-cloud-function",
                        "document_type": document_type,
                        "extraction_method": "pdfplumber_nvr_specific",
                        "table_count": len(tables)
                    }
                }
                
                if len(tables) == 0:
                    result["status"] = "completed_no_tables"
                    result["message"] = "No NVR species tables found in document"
                
                return result, 200
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    
    except Exception as e:
        print(f"Error in extractPdfTables: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        return {
            "extractionId": extraction_id if 'extraction_id' in locals() else 'unknown',
            "status": "failed",
            "error": str(e),
            "tables": []
        }, 500


def download_from_gcs(gs_url: str, local_path: str):
    """Download file from Google Cloud Storage"""
    # Parse gs://bucket/path format
    if not gs_url.startswith('gs://'):
        raise ValueError(f"Invalid GCS URL: {gs_url}")
        
    # Remove gs:// prefix and split bucket/path
    path_parts = gs_url[5:].split('/', 1)
    if len(path_parts) != 2:
        raise ValueError(f"Invalid GCS URL format: {gs_url}")
        
    bucket_name, blob_name = path_parts
    
    # Download using Cloud Storage client
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    
    blob.download_to_filename(local_path)
    print(f"Downloaded {gs_url} to {local_path}")


def download_from_url(http_url: str, local_path: str):
    """Download file from HTTP URL"""
    print(f"Downloading from HTTP: {http_url}")
    
    response = requests.get(http_url, stream=True)
    response.raise_for_status()
    
    with open(local_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    print(f"Downloaded {http_url} to {local_path}")


# For local testing
if __name__ == "__main__":
    # Test with a mock request
    import types
    
    # Create mock request
    mock_request = types.SimpleNamespace()
    mock_request.get_json = lambda silent=False: {
        "fileUrl": "C:/Users/olive/OneDrive/AI Business Operations/Ecology Reports AI/Documents generated from 23_07_25 Meeting/ECOtas_24Jeanneret_Appendix-NVR (1).pdf",
        "documentType": "NVR",
        "extractionId": "test-local"
    }
    
    # Test the function
    result, status = extractPdfTables(mock_request)
    print(f"Result: {json.dumps(result, indent=2)}")
    print(f"Status: {status}")