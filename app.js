document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.querySelector('canvas');
    const form = document.querySelector('.signature-pad-form');
    const clearButton = document.querySelector('.clear-button');
    const submitButton = document.querySelector('.submit-button');
    const signaturePad = new SignaturePad(canvas);

    clearButton.addEventListener('click', (event) => {
        event.preventDefault();
        signaturePad.clear();
    });

    submitButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (signaturePad.isEmpty()) {
            alert("Please provide a signature first.");
            return;
        }

        const imageURL = signaturePad.toDataURL();
        const downloadLink = document.createElement('a');
        downloadLink.href = imageURL;
        downloadLink.download = 'signature.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
});
