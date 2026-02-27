// Category Admin JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Handle icon type change
    const iconTypeRadios = document.querySelectorAll('input[name="icon_type"]');
    const defaultIconSection = document.getElementById('default-icon-section');
    const uploadSection = document.getElementById('upload-section');
    
    function toggleIconSections() {
        const selectedType = document.querySelector('input[name="icon_type"]:checked');
        if (selectedType) {
            if (selectedType.value === 'default') {
                if (defaultIconSection) defaultIconSection.style.display = 'block';
                if (uploadSection) uploadSection.style.display = 'none';
            } else if (selectedType.value === 'uploaded') {
                if (defaultIconSection) defaultIconSection.style.display = 'none';
                if (uploadSection) uploadSection.style.display = 'block';
            }
        }
    }
    
    // Add event listeners
    iconTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleIconSections);
    });
    
    // Initial call
    toggleIconSections();
    
    // Handle default icon selection
    const defaultIconRadios = document.querySelectorAll('input[name="default_icon"]');
    defaultIconRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Remove selected class from all options
            document.querySelectorAll('.icon-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Add selected class to current option
            if (this.checked) {
                this.closest('.icon-option').classList.add('selected');
            }
        });
    });
    
    // Initialize selected state
    defaultIconRadios.forEach(radio => {
        if (radio.checked) {
            radio.closest('.icon-option').classList.add('selected');
        }
    });
    
    // Handle file upload preview
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('icon-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; max-height: 100px;" />`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});


