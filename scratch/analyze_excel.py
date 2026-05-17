
import pandas as pd
import json

file_path = r'c:\Users\zkfnt\Desktop\kkf-admin-dashboard\4.4 도그쇼 A링 출진리스트.xlsx'
try:
    # 엑셀 파일 읽기
    df = pd.read_excel(file_path)
    
    # 헤더 정보
    headers = df.columns.tolist()
    
    # 상위 5개 데이터 샘플
    samples = df.head(5).to_dict(orient='records')
    
    result = {
        "headers": headers,
        "samples": samples,
        "shape": df.shape
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
except Exception as e:
    print(f"Error: {str(e)}")
