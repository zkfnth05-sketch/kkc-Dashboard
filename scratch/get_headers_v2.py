
import zipfile
import xml.etree.ElementTree as ET
import os

file_path = r'c:\Users\zkfnt\Desktop\kkf-admin-dashboard\4.4 도그쇼 A링 출진리스트.xlsx'

def get_excel_rows(path, num_rows=10):
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            shared_strings = []
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    for node in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        shared_strings.append(node.text)

            with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                
                rows_data = []
                for row in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                    row_idx = int(row.get('r'))
                    if row_idx > num_rows: break
                    
                    current_row = []
                    # 엑셀은 빈 셀을 건너뛰는 경우가 있으므로 컬럼 위치(r속성)를 고려해야 함
                    # 간단하게 값을 순서대로 가져옴
                    for cell in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        v_node = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        val = ""
                        if v_node is not None:
                            t = cell.get('t')
                            val_raw = v_node.text
                            if t == 's': # shared string
                                val = shared_strings[int(val_raw)]
                            else:
                                val = val_raw
                        current_row.append(val)
                    rows_data.append(current_row)
                return rows_data
    except Exception as e:
        return f"Error: {str(e)}"

rows = get_excel_rows(file_path, 15)
for i, r in enumerate(rows):
    print(f"Row {i+1}: {r}")
