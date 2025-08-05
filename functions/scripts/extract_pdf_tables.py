#!/usr/bin/env python3
"""
PDF Table Extraction Script for EcoloGen - Natural Values Report (NVR) Focus
Enhanced version that integrates existing NVR flora/fauna extraction with Cloud Functions
"""

import sys
import json
import logging
import os
import re
from typing import List, Dict, Any, Tuple, Optional
import pdfplumber
import pandas as pd
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NVRPDFExtractor:
    def __init__(self, pdf_path: str, document_type: str):
        self.pdf_path = pdf_path
        self.document_type = document_type
        self.pdf = None
        
    def __enter__(self):
        self.pdf = pdfplumber.open(self.pdf_path)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.pdf:
            self.pdf.close()
    
    def parse_dates(self, date_str):
        """Attempt to parse a date string with multiple formats."""
        if pd.isna(date_str) or date_str == '':
            return ''
        for fmt in ("%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
            try:
                parsed_date = pd.to_datetime(date_str, format=fmt)
                return parsed_date.strftime('%d-%m-%Y')
            except (ValueError, TypeError):
                continue
        try:
            parsed_date = pd.to_datetime(date_str, errors='coerce')
            if not pd.isna(parsed_date):
                return parsed_date.strftime('%d-%m-%Y')
        except:
            pass
        return str(date_str)
    
    def clean_and_process_table_data(self, rows: List[List], header: List[str]) -> Dict[str, Any]:
        """Process raw table data into structured format."""
        if not header or not rows:
            return {"headers": [], "rows": [], "processed_data": []}
        
        num_columns = len(header)
        cleaned_rows = []
        
        for i, row in enumerate(rows):
            if len(row) != num_columns:
                # Pad rows that are too short, truncate rows that are too long
                while len(row) < num_columns:
                    row.append(None)
                cleaned_rows.append(row[:num_columns])
            else:
                cleaned_rows.append(row)
        
        # Process data into structured format
        processed_data = []
        for row in cleaned_rows:
            processed_row = {}
            for col_idx, header_name in enumerate(header):
                value = row[col_idx] if col_idx < len(row) else None
                
                # Clean the value
                if value is None or value == '':
                    processed_row[header_name] = None
                else:
                    # Apply date parsing if this looks like a date column
                    if any(date_word in header_name.lower() for date_word in ['date', 'recorded', 'last']):
                        processed_row[header_name] = self.parse_dates(str(value))
                    else:
                        processed_row[header_name] = str(value).strip()
            
            processed_data.append(processed_row)
        
        return {
            "headers": header,
            "rows": cleaned_rows,
            "processed_data": processed_data
        }
    
    def extract_nvr_tables(self) -> List[Dict[str, Any]]:
        """Extract all NVR-specific tables from the PDF."""
        tables_data = []
        
        # Initialize section tracking - matching working script exactly
        outputs = {
            "flora": {"rows": [], "header": None, "page_numbers": []},
            "fauna": {"rows": [], "header": None, "page_numbers": []},
            "flora_range": {"rows": [], "header": None, "page_numbers": []},
            "fauna_range": {"rows": [], "header": None, "page_numbers": []},
        }
        
        try:
            last_section_type = None
            
            for page_num, page in enumerate(self.pdf.pages, 1):
                print(f"Processing page {page_num}")
                logger.info(f"Processing page {page_num}")
                
                tables_on_page = page.find_tables({
                    "vertical_strategy": "lines", 
                    "horizontal_strategy": "lines", 
                    "snap_tolerance": 4
                })
                print(f"Page {page_num}: Found {len(tables_on_page)} tables")
                
                headers_on_page = []
                verified_records_search = page.search("Verified Records", case=False)
                print(f"Page {page_num}: 'Verified Records' found: {len(verified_records_search)} times")
                
                if verified_records_search:
                    range_hits_map = {}
                    
                    # Find range-based headers first
                    fauna_range_hits = page.search(r"Threatened fauna within 5000 metres\s*\(based on Range Boundaries\)", case=False)
                    print(f"Page {page_num}: Found {len(fauna_range_hits)} 'fauna range' headers")
                    range_hits_map['fauna'] = fauna_range_hits
                    for hit in fauna_range_hits:
                        headers_on_page.append({"type": "fauna_range", "bottom": hit["bottom"], "top": hit["top"]})

                    flora_range_hits = page.search(r"Threatened flora within 5000 metres\s*\(based on Range Boundaries\)", case=False)
                    print(f"Page {page_num}: Found {len(flora_range_hits)} 'flora range' headers")
                    range_hits_map['flora'] = flora_range_hits
                    for hit in flora_range_hits:
                        headers_on_page.append({"type": "flora_range", "bottom": hit["bottom"], "top": hit["top"]})

                    # Find standard headers excluding range hits
                    fauna_hits = page.search(r"Threatened fauna within 5000 metres", case=False)
                    print(f"Page {page_num}: Found {len(fauna_hits)} 'fauna' headers (before filtering)")
                    for hit in fauna_hits:
                        if not any(abs(r_hit['top'] - hit['top']) < 5 for r_hit in range_hits_map.get('fauna', [])):
                            headers_on_page.append({"type": "fauna", "bottom": hit["bottom"], "top": hit["top"]})
                    
                    flora_hits = page.search(r"Threatened flora within 5000 metres", case=False)
                    print(f"Page {page_num}: Found {len(flora_hits)} 'flora' headers (before filtering)")
                    for hit in flora_hits:
                         if not any(abs(r_hit['top'] - hit['top']) < 5 for r_hit in range_hits_map.get('flora', [])):
                            headers_on_page.append({"type": "flora", "bottom": hit["bottom"], "top": hit["top"]})

                    headers_on_page.sort(key=lambda x: x["top"])
                    print(f"Page {page_num}: Total headers found after filtering: {len(headers_on_page)}")
                    for header in headers_on_page:
                        print(f"  - {header['type']} at top: {header['top']}, bottom: {header['bottom']}")

                if headers_on_page:
                    last_section_type = None 
                    for i, header in enumerate(headers_on_page):
                        section_type = header["type"]
                        last_section_type = section_type
                        print(f"Page {page_num}: Processing section '{section_type}'")
                        
                        top_boundary = header["bottom"]
                        bottom_boundary = headers_on_page[i+1]["top"] if i + 1 < len(headers_on_page) else page.height

                        for table in tables_on_page:
                            if table.bbox[1] >= top_boundary and table.bbox[3] <= bottom_boundary:
                                content = table.extract()
                                if content:
                                    section = outputs[section_type]
                                    section["page_numbers"].append(page_num)
                                    if section["header"] is None:
                                        section["header"] = content[0]
                                    # Add all rows except the header row if it's duplicated
                                    for row in content:
                                        if row != section["header"]:
                                            section["rows"].append(row)
                            
                elif last_section_type and tables_on_page:
                    section = outputs[last_section_type]
                    header_to_match = section["header"]
                    
                    if header_to_match:
                        for table in tables_on_page:
                            content = table.extract()
                            if content and len(content[0]) == len(header_to_match):
                                section["page_numbers"].append(page_num)
                                for row in content:
                                    if row != header_to_match:
                                        section["rows"].append(row)
                            else:
                                last_section_type = None
                                break 
                    else:
                        last_section_type = None

            # Process all collected sections into structured table data
            table_index = 0
            for section_name, section_data in outputs.items():
                if section_data["rows"] and section_data["header"]:
                    processed_table = self.clean_and_process_table_data(
                        section_data["rows"], 
                        section_data["header"]
                    )
                    
                    table_info = {
                        "pageNumber": section_data["page_numbers"],
                        "tableIndex": table_index,
                        "tableName": section_name,
                        "description": f"NVR {section_name.replace('_', ' ').title()} Data",
                        "headers": processed_table["headers"],
                        "rows": processed_table["rows"],
                        "processed_data": processed_table["processed_data"],
                        "record_count": len(processed_table["processed_data"]),
                        "mergedCells": [],  # NVR tables typically don't have complex merged cells
                        "bbox": [0, 0, 0, 0],  # We could calculate this if needed
                    }
                    
                    tables_data.append(table_info)
                    table_index += 1
                    logger.info(f"Processed {section_name}: {len(processed_table['processed_data'])} records")
                else:
                    logger.warning(f"No data found for {section_name}")

        except Exception as e:
            logger.error(f"Error extracting NVR tables: {str(e)}")
            logger.error(traceback.format_exc())
            raise
            
        return tables_data

def main():
    """Main function to extract tables from PDF"""
    if len(sys.argv) not in [3, 4]:
        print("Usage: python extract_pdf_tables.py <pdf_path> <output_path> [document_type]")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    document_type = sys.argv[3] if len(sys.argv) > 3 else "NVR"
    
    try:
        logger.info(f"Starting NVR PDF extraction for {pdf_path} (type: {document_type})")
        
        with NVRPDFExtractor(pdf_path, document_type) as extractor:
            tables = extractor.extract_nvr_tables()
        
        # Prepare output in the format expected by Cloud Functions
        result = {
            "success": True,
            "document_type": document_type,
            "tables": tables,
            "table_count": len(tables),
            "metadata": {
                "extractor_version": "2.0.0-nvr-specific",
                "pdfplumber_version": pdfplumber.__version__,
                "extraction_type": "threatened_species_focus",
                "sections_extracted": [table["tableName"] for table in tables]
            }
        }
        
        # Write results to output file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"Successfully extracted {len(tables)} tables from NVR")
        print(f"SUCCESS: Extracted {len(tables)} NVR tables")
        
        # Also log table details for debugging
        for table in tables:
            print(f"Table: {table['tableName']} - {table['record_count']} records")
            
        # If no tables were found, provide detailed debugging info
        if len(tables) == 0:
            print("DEBUG: No tables extracted. Providing diagnostic information...")
            result['debug_info'] = {
                'total_pages': len(extractor.pdf.pages),
                'tables_found_per_page': [],
                'text_search_results': {}
            }
            
            # Check each page for tables and search results
            for page_num, page in enumerate(extractor.pdf.pages, 1):
                tables_on_page = page.find_tables()
                result['debug_info']['tables_found_per_page'].append({
                    'page': page_num,
                    'table_count': len(tables_on_page)
                })
                
                # Search for key phrases
                search_results = {}
                search_phrases = [
                    "Threatened fauna within 5000 metres",
                    "Threatened flora within 5000 metres", 
                    "Verified Records",
                    "fauna",
                    "flora",
                    "species"
                ]
                
                for phrase in search_phrases:
                    hits = page.search(phrase, case=False)
                    search_results[phrase] = len(hits)
                    if hits:
                        print(f"Page {page_num}: Found '{phrase}' - {len(hits)} hits")
                
                result['debug_info']['text_search_results'][f'page_{page_num}'] = search_results
            
            print(f"DEBUG: Found tables on pages: {[p['table_count'] for p in result['debug_info']['tables_found_per_page']]}")
            
            # Return as error if no tables found
            result['success'] = False
            result['error'] = f"No species data tables found in PDF. Found {sum(p['table_count'] for p in result['debug_info']['tables_found_per_page'])} total tables across {result['debug_info']['total_pages']} pages, but none contained expected NVR species data format."
        
    except Exception as e:
        logger.error(f"NVR PDF extraction failed: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Write error result
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "tables": []
        }
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(error_result, f, indent=2, ensure_ascii=False)
        except Exception as write_error:
            logger.error(f"Failed to write error result: {write_error}")
        
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()