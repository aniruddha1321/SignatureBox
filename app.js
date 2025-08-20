document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const canvas = document.querySelector('.signature-pad');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const penThicknessSelect = document.getElementById('pen-thickness');
    const typedNameInput = document.getElementById('typed-name');
    const fontStyleSelect = document.getElementById('font-style');
    const addDateCheckbox = document.getElementById('add-date');
    const undoBtn = document.querySelector('.undo-btn');
    const redoBtn = document.querySelector('.redo-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const confirmBtn = document.querySelector('.confirm-btn');
    const signaturesModal = document.getElementById('signatures-modal');
    const closeSignaturesModal = document.getElementById('close-signatures-modal');
    const signaturesList = document.getElementById('signatures-list');
    const previewModal = document.getElementById('preview-modal');
    const backBtn = document.getElementById('back-btn');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const saveSignatureBtn = document.getElementById('save-signature-btn');
    const signaturePreview = document.getElementById('signature-preview');
    const historyList = document.getElementById('history-list');

    // Initialize SignaturePad
    const signaturePad = new SignaturePad(canvas, {
        penColor: '#000000',
        minWidth: 2,
        maxWidth: 2,
        backgroundColor: 'rgba(255, 255, 255, 0)' // Transparent background
    });

    // State Management
    let undoStack = [];
    let redoStack = [];
    let currentSignatureData = null;

    // Utility Functions
    function updateUndoRedoButtons() {
        undoBtn.disabled = undoStack.length === 0;
        redoBtn.disabled = redoStack.length === 0;
    }

    function saveCanvasState() {
        undoStack.push(signaturePad.toData());
        if (undoStack.length > 20) undoStack.shift();
        redoStack = [];
        updateUndoRedoButtons();
    }

    function getCurrentDate() {
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function generateSignaturePreview() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 200;
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw signature
        const signatureImage = new Image();
        signatureImage.onload = function() {
            // Center the signature horizontally
            const signatureWidth = 550;
            const signatureHeight = 140;
            const x = (canvas.width - signatureWidth) / 2;
            const y = 25;
            ctx.drawImage(signatureImage, x, y, signatureWidth, signatureHeight);
            
            // Add typed name if provided
            const typedName = typedNameInput.value.trim();
            if (typedName) {
                ctx.fillStyle = '#000';
                ctx.font = `16px ${fontStyleSelect.value}`;
                ctx.textAlign = 'center';
                ctx.fillText(typedName, canvas.width / 2, 180);
            }
            
            // Add date if checked
            if (addDateCheckbox.checked) {
                ctx.fillStyle = '#666';
                ctx.font = `14px ${fontStyleSelect.value}`;
                ctx.textAlign = 'center';
                ctx.fillText(getCurrentDate(), canvas.width / 2, 195);
            }
            
            // Update preview
            signaturePreview.innerHTML = `<img src="${canvas.toDataURL()}" alt="Signature Preview" />`;
            currentSignatureData = canvas.toDataURL();
        };
        signatureImage.src = signaturePad.toDataURL();
    }

    // Color Swatch Functionality
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', function() {
            colorSwatches.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            signaturePad.penColor = this.dataset.color;
        });
        
        // Keyboard accessibility
        swatch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Pen Thickness Functionality
    penThicknessSelect.addEventListener('change', function() {
        const thickness = parseInt(this.value);
        signaturePad.minWidth = thickness;
        signaturePad.maxWidth = thickness;
    });

    // Canvas Event Listeners
    signaturePad.addEventListener('endStroke', saveCanvasState);

    // Undo Functionality
    undoBtn.addEventListener('click', function() {
        if (undoStack.length > 0) {
            redoStack.push(signaturePad.toData());
            undoStack.pop();
            signaturePad.clear();
            if (undoStack.length > 0) {
                signaturePad.fromData(undoStack[undoStack.length - 1]);
            }
            updateUndoRedoButtons();
        }
    });

    // Redo Functionality
    redoBtn.addEventListener('click', function() {
        if (redoStack.length > 0) {
            const redoData = redoStack.pop();
            undoStack.push(redoData);
            signaturePad.fromData(redoData);
            updateUndoRedoButtons();
        }
    });

    // Clear Functionality
    clearBtn.addEventListener('click', function() {
        signaturePad.clear();
        undoStack = [];
        redoStack = [];
        updateUndoRedoButtons();
    });

    // Confirm & Preview Functionality
    confirmBtn.addEventListener('click', function() {
        if (signaturePad.isEmpty()) {
            alert("Please create a signature first.");
            return;
        }
        generateSignaturePreview();
        previewModal.style.display = 'flex';
        backBtn.focus();
    });

    // My Signatures Modal (can be opened from history items)
    closeSignaturesModal.addEventListener('click', function() {
        signaturesModal.style.display = 'none';
    });

    // Modal Controls
    backBtn.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (previewModal.style.display === 'flex') {
                previewModal.style.display = 'none';
            }
            if (signaturesModal.style.display === 'flex') {
                signaturesModal.style.display = 'none';
            }
        }
    });

    // Download PNG Functionality
    downloadPngBtn.addEventListener('click', function() {
        if (!currentSignatureData) return;
        
        const link = document.createElement('a');
        link.download = `signature_${Date.now()}.png`;
        link.href = currentSignatureData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        saveToHistory();
        previewModal.style.display = 'none';
    });

    // Download PDF Functionality
    downloadPdfBtn.addEventListener('click', function() {
        if (!currentSignatureData) return;
        
        // Load jsPDF if not available
        if (typeof window.jspdf === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = generatePDF;
            document.head.appendChild(script);
        } else {
            generatePDF();
        }
    });

    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add signature image
        const img = new Image();
        img.onload = function() {
            doc.addImage(currentSignatureData, 'PNG', 20, 50, 170, 68);
            doc.save(`signature_${Date.now()}.pdf`);
            saveToHistory();
            previewModal.style.display = 'none';
        };
        img.src = currentSignatureData;
    }

    // Save Signature Functionality
    saveSignatureBtn.addEventListener('click', function() {
        saveToHistory();
        alert('Signature saved successfully!');
        previewModal.style.display = 'none';
    });

    // History Management
    function saveToHistory() {
        if (!currentSignatureData) return;
        
        let history = JSON.parse(localStorage.getItem('signatureHistory') || '[]');
        const signatureRecord = {
            id: Date.now(),
            dataUrl: currentSignatureData,
            name: typedNameInput.value.trim(),
            date: getCurrentDate(),
            timestamp: new Date().toISOString()
        };
        
        history.unshift(signatureRecord);
        history = history.slice(0, 10); // Keep last 10
        localStorage.setItem('signatureHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('signatureHistory') || '[]');
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No saved signatures yet.</p>';
            return;
        }
        
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <img src="${item.dataUrl}" alt="Saved signature ${index + 1}" />
                <div style="font-size: 0.85rem; margin-bottom: 0.75rem;">
                    ${item.name ? `<div><strong>${item.name}</strong></div>` : ''}
                    <div style="color: #666;">${item.date}</div>
                </div>
                <div class="item-actions">
                    <button type="button" class="secondary-btn" onclick="useSignature('${item.id}')" aria-label="Use this signature">Use This</button>
                    <button type="button" class="tertiary-btn" onclick="deleteSignature('${item.id}')" aria-label="Delete this signature">Delete</button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    }

    function renderSignatures() {
        const history = JSON.parse(localStorage.getItem('signatureHistory') || '[]');
        signaturesList.innerHTML = '';
        
        if (history.length === 0) {
            signaturesList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; grid-column: 1 / -1;">No saved signatures yet.</p>';
            return;
        }
        
        history.forEach((item, index) => {
            const signatureItem = document.createElement('div');
            signatureItem.className = 'signature-item';
            signatureItem.innerHTML = `
                <img src="${item.dataUrl}" alt="Saved signature ${index + 1}" />
                <div style="font-size: 0.85rem; margin-bottom: 0.75rem;">
                    ${item.name ? `<div><strong>${item.name}</strong></div>` : ''}
                    <div style="color: #666;">${item.date}</div>
                </div>
                <div class="item-actions">
                    <button type="button" class="secondary-btn" onclick="useSignature('${item.id}')" aria-label="Use this signature">Use This</button>
                    <button type="button" class="tertiary-btn" onclick="deleteSignature('${item.id}')" aria-label="Delete this signature">Delete</button>
                </div>
            `;
            signaturesList.appendChild(signatureItem);
        });
    }

    // Global functions for history actions
    window.useSignature = function(id) {
        const history = JSON.parse(localStorage.getItem('signatureHistory') || '[]');
        const signature = history.find(s => s.id == id);
        if (signature) {
            // Load signature data
            const img = new Image();
            img.onload = function() {
                signaturePad.clear();
                signaturePad.fromDataURL(signature.dataUrl);
                if (signature.name) {
                    typedNameInput.value = signature.name;
                }
                signaturesModal.style.display = 'none';
                // Scroll to top
                window.scrollTo(0, 0);
            };
            img.src = signature.dataUrl;
        }
    };

    window.deleteSignature = function(id) {
        if (confirm('Are you sure you want to delete this signature?')) {
            let history = JSON.parse(localStorage.getItem('signatureHistory') || '[]');
            history = history.filter(s => s.id != id);
            localStorage.setItem('signatureHistory', JSON.stringify(history));
            renderHistory();
            renderSignatures();
        }
    };

    // Keyboard Navigation Enhancement
    document.addEventListener('keydown', function(e) {
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoBtn.click();
        }
        // Ctrl+Shift+Z for redo
        if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            redoBtn.click();
        }
        // Delete key for clear
        if (e.key === 'Delete' && document.activeElement === canvas) {
            e.preventDefault();
            clearBtn.click();
        }
    });

    // Canvas keyboard accessibility
    canvas.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmBtn.click();
        }
    });

    // Initialize
    updateUndoRedoButtons();
    renderHistory();
    
    // Focus management
    canvas.setAttribute('tabindex', '0');
    colorSwatches.forEach(swatch => swatch.setAttribute('tabindex', '0'));
});
