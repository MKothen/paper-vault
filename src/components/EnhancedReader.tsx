// ...other code remains unchanged above...
            <Document 
              file={paper.pdfUrl} 
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onItemClick={({ pageNumber }) => setPageNumber(pageNumber)} // handle internal PDF links
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true} 
                renderAnnotationLayer={true} 
              />
            </Document>
// ...rest of the code remains the same...
