document.addEventListener('DOMContentLoaded', function() {
    // This function will be called by the auth check at the bottom of add.html
    window.initializeApp = function() {
        // Initialize SSE connection for real-time OCR updates
        // NOTE: This is no longer the primary method for receiving OCR results, but we keep it for now.
        const eventSource = new EventSource('/api/sse/ocr-updates');
        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('Received SSE data:', data);
            
            if (data.type === 'ocr-result') {
                handleOCRResult(data.data);
            } else if (data.type === 'connected') {
                // This confirms the SSE connection is established on the server.
                // It's a good place to enable UI elements if they were disabled.
                console.log('[SSE] Connection established with server.');
            }
        };
        
        eventSource.onerror = function(error) {
            console.error('SSE Error:', error);
        };
    }

    const addExpenseForm = document.getElementById('add-expense-form');
    addExpenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const item = document.getElementById('item').value;
        const amount = document.getElementById('amount').value;
        const expense_date = document.getElementById('expense_date').value;
        const category = document.getElementById('category').value;
        
        fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item, amount, expense_date, category })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'success') {
                addExpenseForm.reset();
                Swal.fire({
                    title: 'สำเร็จ! 🎉',
                    text: 'เพิ่มรายจ่ายเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                    confirmButtonColor: '#ff7300',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด! ❌',
                    text: data.error || 'ไม่สามารถเพิ่มรายจ่ายได้',
                    icon: 'error',
                    confirmButtonText: 'ลองใหม่',
                    confirmButtonColor: '#ff7300'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด! ❌',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                icon: 'error',
                confirmButtonText: 'ลองใหม่',
                confirmButtonColor: '#ff7300'
            });
        });
    });

    // OCR functionality
    const uploadOcrButton = document.getElementById('upload-ocr');
    const ocrFileGallery = document.getElementById('ocr-file-gallery');
    const ocrFileCamera = document.getElementById('ocr-file-camera');
    const ocrResultDiv = document.getElementById('ocr-result');
    const scanBtn = document.getElementById('scan-btn');
    const previewDiv = document.getElementById('selected-image-preview');
    
    // Modal elements
    const optionModal = document.getElementById('option-modal');
    const selectionStep = document.getElementById('selection-step');
    const previewStep = document.getElementById('preview-step');
    const cameraOptionBtn = document.getElementById('camera-option-btn');
    const galleryOptionBtn = document.getElementById('gallery-option-btn');
    const closeOptionBtn = document.getElementById('close-option-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Preview step elements
    const modalImagePreview = document.getElementById('modal-image-preview');
    const uploadFromModal = document.getElementById('upload-from-modal');
    const backToSelection = document.getElementById('back-to-selection');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    
    let selectedFile = null;
    let selectedFileUrl = null; // Variable to store the image Data URL

    // Main scan button - opens option modal
    scanBtn.addEventListener('click', function() {
        showSelectionStep();
        optionModal.style.display = 'flex';
    });

    // Show selection step
    function showSelectionStep() {
        selectionStep.style.display = 'block';
        previewStep.style.display = 'none';
    }

    // Show preview step
    function showPreviewStep() {
        selectionStep.style.display = 'none';
        previewStep.style.display = 'block';
    }

    // Close option modal
    closeOptionBtn.addEventListener('click', closeOptionModal);
    closePreviewBtn.addEventListener('click', closeOptionModal);
    modalOverlay.addEventListener('click', closeOptionModal);

    function closeOptionModal() {
        optionModal.style.display = 'none';
        showSelectionStep(); // Reset to selection step
        // Do not clear selectedFileUrl here, as we need it for the result display
        // It will be cleared when a new scan is initiated or the page is left.
        selectedFile = null;
        // selectedFileUrl = null; // <-- REMOVED THIS LINE
    }

    // Back to selection
    backToSelection.addEventListener('click', function() {
        showSelectionStep();
        selectedFile = null;
        selectedFileUrl = null;
    });

    // Camera option - opens native camera app
    cameraOptionBtn.addEventListener('click', function() {
        ocrFileCamera.click();
    });

    // Gallery option - opens file picker
    galleryOptionBtn.addEventListener('click', function() {
        ocrFileGallery.click();
    });

    // Handle gallery selection
    ocrFileGallery.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            generateAndShowImagePreview(selectedFile);
            showPreviewStep();
        }
    });

    // Handle camera capture
    ocrFileCamera.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            generateAndShowImagePreview(selectedFile);
            showPreviewStep();
        }
    });

    // Generate a Data URL from the file and show the preview in the modal
    function generateAndShowImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedFileUrl = e.target.result; // Store the Data URL
            modalImagePreview.innerHTML = `
                <img src="${selectedFileUrl}" alt="Selected image">
            `;
        };
        reader.readAsDataURL(file); // This generates the Data URL
    }

    // Show image preview (outside modal - for backward compatibility)
    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `
                <p>Selected image:</p>
                <img src="${e.target.result}" alt="Selected image">
            `;
        };
        reader.readAsDataURL(file);
    }

    // Upload from modal
    uploadFromModal.addEventListener('click', function() {
        uploadImageForOCR();
    });

    // Original upload button (for backward compatibility)
    uploadOcrButton.addEventListener('click', function() {
        uploadImageForOCR();
    });

    // Upload function
    function uploadImageForOCR() {
        if (!selectedFile) {
            alert('กรุณาเลือกรูปภาพก่อน');
            return;
        }

        const formData = new FormData();
        formData.append('ocrFile', selectedFile);

        // Close the selection modal
        closeOptionModal();

        // Show a loading SweetAlert
        Swal.fire({
            title: 'กำลังอัปโหลดและประมวลผล',
            text: 'กรุณารอสักครู่ ระบบกำลังสแกนข้อมูลจากรูปภาพ...',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch('/api/ocr/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Server error') });
            }
            return response.json();
        })
        .then(result => {
            Swal.close(); // Close the loading alert on success
            console.log('Received OCR result directly from server:', result);
            if (result && result.type === 'ocr-result') {
                handleOCRResult(result.data);
            } else {
                throw new Error('Invalid data format received from server.');
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด! ❌',
                text: error.message || 'ไม่สามารถอัปโหลดหรือประมวลผลไฟล์ได้',
                icon: 'error',
                confirmButtonColor: '#ff7300'
            });
        });
    }

    // Handle OCR result from SSE
    function handleOCRResult(ocrData) {
        console.log('Processing OCR result:', ocrData);
        
        // Close modal if open
        closeOptionModal();

        // Clear any previous loading/error messages
        ocrResultDiv.innerHTML = '';
        
        if (ocrData) {
            let resultHtml = `
                <div class="ocr-result-card">
                    <div class="ocr-result-header">
                        <h3>📄 ผลการสแกน</h3>
                        <p>ข้อมูลที่ดึงได้จากรูปภาพ:</p>
                    </div>
                    <div class="ocr-result-content">
            `;

            resultHtml += `<div class="ocr-data-list">`;

            const item = ocrData['Items '] || ocrData.Items || ocrData.item;
            const amount = ocrData.Amount || ocrData.amount;
            const date = ocrData.Date || ocrData.date;

            if (item) resultHtml += `<div class="ocr-data-item"><span class="data-label">รายการ:</span><span class="data-value">${item}</span></div>`;
            if (amount) resultHtml += `<div class="ocr-data-item"><span class="data-label">จำนวนเงิน:</span><span class="data-value">${amount} บาท</span></div>`;
            if (date) resultHtml += `<div class="ocr-data-item"><span class="data-label">วันที่:</span><span class="data-value">${date}</span></div>`;
            
            resultHtml += `</div></div></div>`;
            ocrResultDiv.innerHTML = resultHtml;

            // Auto-fill form fields with structured data
            autoFillFormFromOCR(ocrData);
        } else {
            ocrResultDiv.innerHTML = '<div class="error-message">ไม่สามารถแยกข้อความจากรูปภาพได้</div>';
            Swal.fire({
                title: 'ไม่พบข้อมูล 📄❌',
                text: 'ไม่สามารถแยกข้อความจากรูปภาพได้ กรุณาลองใหม่',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#ff7300'
            });
        }
    }

    // Auto-fill form fields from OCR data (structured data from n8n)
    function autoFillFormFromOCR(ocrData) {
        // Handle structured data from n8n webhook
        if (typeof ocrData === 'object' && ocrData !== null) {
            // Fill item field
            if (ocrData['Items '] || ocrData.Items || ocrData.item) {
                const itemValue = ocrData['Items '] || ocrData.Items || ocrData.item;
                document.getElementById('item').value = itemValue.toString().trim();
            }
            
            // Fill amount field
            if (ocrData.Amount || ocrData.amount) {
                const amountValue = ocrData.Amount || ocrData.amount;
                document.getElementById('amount').value = parseFloat(amountValue);
            }
            
            // Fill date field - convert from "DD MM YY" to "YYYY-MM-DD"
            if (ocrData.Date || ocrData.date) {
                const dateString = (ocrData.Date || ocrData.date).toString().trim();
                const convertedDate = convertDateFormat(dateString);
                if (convertedDate) {
                    document.getElementById('expense_date').value = convertedDate;
                }
            }
            
            // Don't auto-select category - let user choose
        } else if (typeof ocrData === 'string') {
            // Handle plain text OCR result (legacy support)
            autoFillFormFromOCRText(ocrData);
        }
    }
    
    // Convert date from various formats to "YYYY-MM-DD" format
    function convertDateFormat(dateString) {
        try {
            // Handle formats like "18 07 25", "18/07/25", "18-07-25", "18 07 2567", "18/07/2024"
            const cleanDate = dateString.replace(/[\/\-\s]+/g, ' ').trim();
            const parts = cleanDate.split(' ');
            
            if (parts.length >= 3) {
                let day = parts[0].padStart(2, '0');
                let month = parts[1].padStart(2, '0');
                let year = parts[2];
                
                // Handle different year formats
                if (year.length === 2) {
                    // 2-digit year: convert to 4-digit
                    const currentYear = new Date().getFullYear();
                    const currentCentury = Math.floor(currentYear / 100) * 100;
                    const yearNum = parseInt(year);
                    
                    // If year is greater than current year's last 2 digits, assume previous century
                    if (yearNum > (currentYear % 100)) {
                        year = (currentCentury - 100 + yearNum).toString();
                    } else {
                        year = (currentCentury + yearNum).toString();
                    }
                } else if (year.length === 4) {
                    // 4-digit year: check if it's Buddhist Era (พ.ศ.) or Christian Era (ค.ศ.)
                    const yearNum = parseInt(year);
                    
                    // Buddhist Era years are typically 2500+ (543 years ahead of Christian Era)
                    // If year is between 2500-2700, assume it's Buddhist Era and convert to Christian Era
                    if (yearNum >= 2500 && yearNum <= 2700) {
                        year = (yearNum - 543).toString();
                    }
                    // If year is between 1900-2100, assume it's already Christian Era
                    else if (yearNum >= 1900 && yearNum <= 2100) {
                        year = yearNum.toString();
                    }
                    // If year seems invalid, use current year
                    else {
                        console.warn(`Invalid year detected: ${yearNum}, using current year`);
                        year = new Date().getFullYear().toString();
                    }
                }
                
                // Validate the converted date
                const convertedDate = `${year}-${month}-${day}`;
                const dateObj = new Date(convertedDate);
                
                // Check if the date is valid
                if (dateObj.getFullYear() == year && 
                    dateObj.getMonth() == (parseInt(month) - 1) && 
                    dateObj.getDate() == parseInt(day)) {
                    return convertedDate;
                }
            }
            
            // Try to handle other formats like "DD/MM/YYYY" or "DD-MM-YYYY"
            const altFormats = [
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // DD/MM/YY or DD/MM/YYYY
                /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/   // YYYY/MM/DD
            ];
            
            for (const format of altFormats) {
                const match = dateString.match(format);
                if (match) {
                    let [, part1, part2, part3] = match;
                    
                    // Determine which format it is based on the first part
                    let day, month, year;
                    
                    if (part1.length === 4) {
                        // YYYY/MM/DD format
                        year = part1;
                        month = part2.padStart(2, '0');
                        day = part3.padStart(2, '0');
                    } else {
                        // DD/MM/YYYY format
                        day = part1.padStart(2, '0');
                        month = part2.padStart(2, '0');
                        year = part3;
                    }
                    
                    // Handle Buddhist Era conversion for 4-digit years
                    if (year.length === 4) {
                        const yearNum = parseInt(year);
                        if (yearNum >= 2500 && yearNum <= 2700) {
                            year = (yearNum - 543).toString();
                        }
                    } else if (year.length === 2) {
                        // Convert 2-digit to 4-digit
                        const currentYear = new Date().getFullYear();
                        const currentCentury = Math.floor(currentYear / 100) * 100;
                        const yearNum = parseInt(year);
                        
                        if (yearNum > (currentYear % 100)) {
                            year = (currentCentury - 100 + yearNum).toString();
                        } else {
                            year = (currentCentury + yearNum).toString();
                        }
                    }
                    
                    const convertedDate = `${year}-${month}-${day}`;
                    const dateObj = new Date(convertedDate);
                    
                    // Validate date
                    if (dateObj.getFullYear() == year && 
                        dateObj.getMonth() == (parseInt(month) - 1) && 
                        dateObj.getDate() == parseInt(day)) {
                        return convertedDate;
                    }
                }
            }
            
        } catch (error) {
            console.error('Error converting date:', error);
        }
        
        // Fallback to current date if all parsing fails
        console.warn(`Could not parse date: "${dateString}", using current date`);
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }
    
    // Legacy function for plain text OCR (keep for backward compatibility)
    function autoFillFormFromOCRText(ocrText) {
        // Extract amount (Thai Baht or numbers with decimal)
        const amountMatches = ocrText.match(/(\d+[,.]?\d*)\s*(บาท|฿|THB|B)|(\d+[,.]?\d+)/g);
        if (amountMatches) {
            // Clean and parse the amount
            const amount = amountMatches[0].replace(/[บาท฿THBB,]/g, '').trim();
            if (amount && !isNaN(parseFloat(amount))) {
                document.getElementById('amount').value = parseFloat(amount);
            }
        }

        // Just use a simple placeholder for legacy text OCR
        document.getElementById('item').value = "รายการจากการสแกน";

        // Don't auto-select category - let user choose

        // Set current date only (without time) if not set
        const dateInput = document.getElementById('expense_date');
        if (!dateInput.value) {
            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            dateInput.value = localDate;
        }
    }
});