/**
 * Direct test script for PDF extraction debugging - NVR Focus
 * Mimics the Python extract_pdf_tables.py search patterns
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

function searchTextForPattern(text, pattern, caseSensitive = false) {
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(pattern, flags);
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      line: text.substring(0, match.index).split('\n').length
    });
  }
  return matches;
}

async function testNVRExtraction(pdfPath) {
  try {
    console.log(`Testing NVR PDF extraction for: ${pdfPath}`);
    console.log('='.repeat(80));
    
    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);
    
    // Extract text
    const pdfData = await pdfParse(pdfBuffer);
    console.log(`Extracted text length: ${pdfData.text.length} characters`);
    console.log(`Number of pages: ${pdfData.numpages}`);
    
    // Split into lines for analysis
    const lines = pdfData.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`Total lines: ${lines.length}`);
    
    console.log('\n=== NVR-SPECIFIC PATTERN SEARCH ===');
    
    // Search for specific NVR patterns (matching Python script)
    const nvrPatterns = {
      'fauna_range': /Threatened fauna within 5000 metres\s*\(based on Range Boundaries\)/gi,
      'flora_range': /Threatened flora within 5000 metres\s*\(based on Range Boundaries\)/gi,
      'fauna_verified': /Threatened fauna within 5000 metres/gi,
      'flora_verified': /Threatened flora within 5000 metres/gi,
      'verified_records': /Verified Records/gi,
      'fauna_500m': /Threatened fauna within 500 metres/gi,
      'flora_500m': /Threatened flora within 500 metres/gi
    };
    
    const searchResults = {};
    for (const [patternName, pattern] of Object.entries(nvrPatterns)) {
      const matches = searchTextForPattern(pdfData.text, pattern.source, false);
      searchResults[patternName] = matches;
      console.log(`${patternName}: ${matches.length} matches`);
      
      if (matches.length > 0) {
        matches.forEach((match, idx) => {
          console.log(`  ${idx + 1}. Line ${match.line}: "${match.match}"`);
        });
      }
    }
    
    console.log('\n=== PAGE-BY-PAGE ANALYSIS ===');
    
    // Simulate page-by-page analysis (since pdf-parse doesn't give us page boundaries easily)
    // We'll estimate based on page breaks or form feeds
    const estimatedPageBreaks = pdfData.text.split(/Page \d+ of\d+|^\f/gm);
    console.log(`Estimated page sections: ${estimatedPageBreaks.length}`);
    
    estimatedPageBreaks.forEach((pageText, pageIdx) => {
      if (pageText.trim().length < 50) return; // Skip very short sections
      
      console.log(`\nPage ${pageIdx + 1} Analysis:`);
      
      // Check for verified records on this page
      const verifiedMatches = searchTextForPattern(pageText, 'Verified Records', false);
      if (verifiedMatches.length > 0) {
        console.log(`  ✓ Contains "Verified Records" (${verifiedMatches.length} times)`);
        
        // Look for fauna/flora headers after verified records
        const faunaRangeMatches = searchTextForPattern(pageText, 'Threatened fauna within 5000 metres.*Range Boundaries', false);
        const floraRangeMatches = searchTextForPattern(pageText, 'Threatened flora within 5000 metres.*Range Boundaries', false);
        const faunaMatches = searchTextForPattern(pageText, 'Threatened fauna within 5000 metres', false);
        const floraMatches = searchTextForPattern(pageText, 'Threatened flora within 5000 metres', false);
        
        console.log(`    - Fauna Range headers: ${faunaRangeMatches.length}`);
        console.log(`    - Flora Range headers: ${floraRangeMatches.length}`);
        console.log(`    - Regular Fauna headers: ${faunaMatches.length - faunaRangeMatches.length}`);
        console.log(`    - Regular Flora headers: ${floraMatches.length - floraRangeMatches.length}`);
        
        // Look for tabular data
        const pageLines = pageText.split('\n').filter(line => line.trim().length > 0);
        const tabularLines = pageLines.filter(line => {
          const parts = line.split(/\s{3,}|\t+/).filter(p => p.trim().length > 0);
          return parts.length >= 3 && parts.length <= 8; // Typical for species tables
        });
        
        console.log(`    - Potential table rows: ${tabularLines.length}`);
        if (tabularLines.length > 0) {
          console.log(`    - Sample rows:`);
          tabularLines.slice(0, 3).forEach((line, idx) => {
            console.log(`      ${idx + 1}: ${line.substring(0, 80)}...`);
          });
        }
      } else {
        console.log(`  - No "Verified Records" found`);
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total NVR pattern matches found:`);
    Object.entries(searchResults).forEach(([pattern, matches]) => {
      console.log(`  ${pattern}: ${matches.length} matches`);
    });
    
    // Recommendations
    console.log('\n=== RECOMMENDATIONS ===');
    if (searchResults.verified_records.length === 0) {
      console.log('❌ No "Verified Records" sections found - this may not be a standard NVR document');
    } else {
      console.log('✅ Found "Verified Records" sections - this appears to be an NVR document');
    }
    
    const totalSpeciesHeaders = searchResults.fauna_range.length + searchResults.flora_range.length + 
                              searchResults.fauna_verified.length + searchResults.flora_verified.length;
    
    if (totalSpeciesHeaders === 0) {
      console.log('❌ No species section headers found - check if this document contains species data');
    } else {
      console.log(`✅ Found ${totalSpeciesHeaders} species section headers`);
    }
    
    // Show sample lines for debugging
    console.log('\n=== SAMPLE LINES FOR DEBUGGING ===');
    const interestingLines = lines.filter(line => 
      /threatened|fauna|flora|species|scientific|conservation/i.test(line)
    ).slice(0, 10);
    
    interestingLines.forEach((line, idx) => {
      console.log(`${idx + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage: node test-pdf-extraction.js path/to/your/file.pdf
if (process.argv[2]) {
  testNVRExtraction(process.argv[2]);
} else {
  console.log('Usage: node test-pdf-extraction.js path/to/your/file.pdf');
  console.log('This script analyzes PDFs for NVR (Natural Values Report) patterns');
}