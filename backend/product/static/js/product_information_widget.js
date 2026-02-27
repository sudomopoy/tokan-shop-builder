// static/js/product_data_widget.js
document.addEventListener('DOMContentLoaded', function () {
    // مقداردهی اولیه برای هر ویجت در صفحه
    document.querySelectorAll('.product-data-widget').forEach(initProductDataWidget);
});

function initProductDataWidget(widget) {
    const jsonInput = widget.querySelector('.json-data');
    let data = {
        sizing_table: {
            headers: ['سایز'],
            titles: [''],
            rows: []
        },
        features: []
    };

    try {
        const parsed = JSON.parse(jsonInput.value || '{}');
        if (parsed.sizing_table) data.sizing_table = parsed.sizing_table;
        if (parsed.features) data.features = parsed.features;
    } catch (e) {
        console.error('Error parsing JSON data', e);
    }

    // --- بخش جدول اندازه‌ها ---
    const sizingTable = widget.querySelector('.sizing-table');
    const columnHeadersRow = sizingTable.querySelector('.column-headers');
    const columnTitlesRow = sizingTable.querySelector('.column-titles');
    const tableBody = sizingTable.querySelector('.table-body');

    function renderSizingTable() {
        // رندر هدرهای ستون‌ها
        columnHeadersRow.innerHTML = '';
        columnTitlesRow.innerHTML = '';

        data.sizing_table.headers.forEach((header, colIndex) => {
            const headerCell = document.createElement('th');
            headerCell.innerHTML = `
                <input type="text" class="form-control form-control-sm header-input" 
                       value="${header}" data-col="${colIndex}">
                <span class="remove-btn remove-column" data-col="${colIndex}">×</span>
            `;
            columnHeadersRow.appendChild(headerCell);

            const titleCell = document.createElement('td');
            titleCell.innerHTML = `
                <input type="text" class="form-control form-control-sm title-input" 
                       value="${data.sizing_table.titles[colIndex] || ''}" data-col="${colIndex}">
            `;
            columnTitlesRow.appendChild(titleCell);
        });

        // رندر سطرهای داده
        tableBody.innerHTML = '';
        data.sizing_table.rows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');

            data.sizing_table.headers.forEach((_, colIndex) => {
                const td = document.createElement('td');
                td.innerHTML = `
                    <input type="text" class="form-control form-control-sm cell-input" 
                           value="${row[colIndex] || ''}" 
                           data-row="${rowIndex}" data-col="${colIndex}">
                `;
                tr.appendChild(td);
            });

            const actionTd = document.createElement('td');
            actionTd.innerHTML = `
                <span class="remove-btn remove-row" data-row="${rowIndex}">×</span>
            `;
            tr.appendChild(actionTd);

            tableBody.appendChild(tr);
        });

        updateJsonInput();
    }

    // اضافه کردن ستون جدید
    widget.querySelector('.add-sizing-column').addEventListener('click', () => {
        data.sizing_table.headers.push(`ستون ${data.sizing_table.headers.length + 1}`);
        data.sizing_table.titles.push('');

        // اضافه کردن ستون به سطرهای موجود
        data.sizing_table.rows.forEach(row => row.push(''));

        renderSizingTable();
    });

    // اضافه کردن سطر جدید
    widget.querySelector('.add-sizing-row').addEventListener('click', () => {
        const newRow = new Array(data.sizing_table.headers.length).fill('');
        data.sizing_table.rows.push(newRow);
        renderSizingTable();
    });

    // حذف ستون
    sizingTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-column')) {
            const colIndex = parseInt(e.target.dataset.col);

            data.sizing_table.headers.splice(colIndex, 1);
            data.sizing_table.titles.splice(colIndex, 1);
            data.sizing_table.rows.forEach(row => row.splice(colIndex, 1));

            renderSizingTable();
        }
    });

    // حذف سطر
    sizingTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row')) {
            const rowIndex = parseInt(e.target.dataset.row);
            data.sizing_table.rows.splice(rowIndex, 1);
            renderSizingTable();
        }
    });

    // تغییر هدرها
    sizingTable.addEventListener('change', (e) => {
        if (e.target.classList.contains('header-input')) {
            const colIndex = parseInt(e.target.dataset.col);
            data.sizing_table.headers[colIndex] = e.target.value;
            updateJsonInput();
        }

        if (e.target.classList.contains('title-input')) {
            const colIndex = parseInt(e.target.dataset.col);
            data.sizing_table.titles[colIndex] = e.target.value;
            updateJsonInput();
        }

        if (e.target.classList.contains('cell-input')) {
            const rowIndex = parseInt(e.target.dataset.row);
            const colIndex = parseInt(e.target.dataset.col);
            data.sizing_table.rows[rowIndex][colIndex] = e.target.value;
            updateJsonInput();
        }
    });

    // --- بخش ویژگی‌های محصول ---
    const featuresList = widget.querySelector('.features-list');

    function renderFeatures() {
        featuresList.innerHTML = '';

        data.features.forEach((feature, index) => {
            const featureDiv = document.createElement('div');
            featureDiv.className = 'feature-item';
            featureDiv.innerHTML = `
                <input type="text" class="form-control form-control-sm feature-key" 
                       value="${feature.key || ''}" placeholder="نام ویژگی" data-index="${index}">
                <input type="text" class="form-control form-control-sm feature-value" 
                       value="${feature.value || ''}" placeholder="مقدار" data-index="${index}">
                <span class="remove-btn remove-feature" data-index="${index}">×</span>
            `;
            featuresList.appendChild(featureDiv);
        });

        updateJsonInput();
    }

    // اضافه کردن ویژگی جدید
    widget.querySelector('.add-feature').addEventListener('click', () => {
        data.features.push({ key: '', value: '' });
        renderFeatures();
    });

    // حذف ویژگی
    featuresList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-feature')) {
            const index = parseInt(e.target.dataset.index);
            data.features.splice(index, 1);
            renderFeatures();
        }
    });

    // تغییر ویژگی‌ها
    featuresList.addEventListener('change', (e) => {
        if (e.target.classList.contains('feature-key')) {
            const index = parseInt(e.target.dataset.index);
            data.features[index].key = e.target.value;
            updateJsonInput();
        }

        if (e.target.classList.contains('feature-value')) {
            const index = parseInt(e.target.dataset.index);
            data.features[index].value = e.target.value;
            updateJsonInput();
        }
    });

    // به‌روزرسانی فیلد JSON مخفی
    function updateJsonInput() {
        jsonInput.value = JSON.stringify(data);
    }

    // رندر اولیه
    renderSizingTable();
    renderFeatures();
}