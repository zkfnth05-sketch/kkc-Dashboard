
import zipfile
import xml.etree.ElementTree as ET
import os

file_path = r'c:\Users\zkfnt\Desktop\kkf-admin-dashboard\4.4 도그쇼 A링 출진리스트.xlsx'

def get_excel_headers(path):
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            # sharedStrings.xml 읽기 (문자열 데이터)
            shared_strings = []
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                with zip_ref.open('xl/sharedStrings.xml') as f:
                    tree = ET.parse(f)
                    for node in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                        shared_strings.append(node.text)

            # sheet1.xml 읽기 (구조)
            with zip_ref.open('xl/worksheets/sheet1.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                
                # 첫 번째 행(Row 1) 찾기
                headers = []
                for row in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                    if row.get('r') == '1': # 첫 번째 줄
                        for cell in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                            v_node = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            if v_node is not None:
                                t = cell.get('t')
                                val = v_node.text
                                if t == 's': # shared string
                                    headers.append(shared_strings[int(val)])
                                else:
                                    headers.append(val)
                        break
                return headers
    except Exception as e:
        return f"Error: {str(e)}"

headers = get_excel_headers(file_path)
print(headers)
