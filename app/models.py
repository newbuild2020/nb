class Worker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # 基本情報
    name = db.Column(db.String(100), nullable=False)  # 姓名
    name_kana = db.Column(db.String(100), nullable=False)  # ふりがな
    name_romaji = db.Column(db.String(100), nullable=False)  # ローマ字
    birth_date = db.Column(db.Date, nullable=False)  # 生年月日
    age = db.Column(db.Integer, nullable=False)  # 年齢
    gender = db.Column(db.String(10), nullable=False)  # 性別
    nationality = db.Column(db.String(50), nullable=False)  # 国籍
    visa_type = db.Column(db.String(50), nullable=False)  # 在留資格
    visa_expiry = db.Column(db.Date, nullable=False)  # 在留期限
    passport_number = db.Column(db.String(50), nullable=False)  # パスポート番号
    passport_expiry = db.Column(db.Date, nullable=False)  # パスポート有効期限
    phone = db.Column(db.String(20), nullable=False)  # 電話番号
    email = db.Column(db.String(120))  # メールアドレス
    
    # 住所情報
    postal_code = db.Column(db.String(8), nullable=False)  # 郵便番号
    address = db.Column(db.String(200), nullable=False)  # 住所
    address_kana = db.Column(db.String(200), nullable=False)  # 住所（カナ）
    building_name = db.Column(db.String(100))  # 建物名
    building_name_kana = db.Column(db.String(100))  # 建物名（カナ）
    cho_me = db.Column(db.String(50))  # 丁目
    
    # 緊急連絡先
    emergency_name = db.Column(db.String(100), nullable=False)  # 緊急連絡先氏名
    emergency_relationship = db.Column(db.String(50), nullable=False)  # 続柄
    emergency_phone = db.Column(db.String(20), nullable=False)  # 緊急連絡先電話番号
    emergency_postal_code = db.Column(db.String(8))  # 緊急連絡先郵便番号
    emergency_address = db.Column(db.String(200))  # 緊急連絡先住所
    emergency_address_kana = db.Column(db.String(200))  # 緊急連絡先住所（カナ）
    emergency_building_name = db.Column(db.String(100))  # 緊急連絡先建物名
    emergency_building_name_kana = db.Column(db.String(100))  # 緊急連絡先建物名（カナ）
    emergency_cho_me = db.Column(db.String(50))  # 緊急連絡先丁目
    
    # 職種・経験
    job_type = db.Column(db.String(50), nullable=False)  # 職種
    experience_years = db.Column(db.Integer, nullable=False)  # 経験年数
    experience_months = db.Column(db.Integer, nullable=False)  # 経験月数
    japanese_level = db.Column(db.String(20), nullable=False)  # 日本語レベル
    
    # 保険・健康情報
    health_check_date = db.Column(db.Date, nullable=False)  # 健康診断日
    health_check_expiry = db.Column(db.Date, nullable=False)  # 健康診断有効期限
    accident_insurance_expiry = db.Column(db.Date, nullable=False)  # 労災保険満了日
    employment_insurance_expiry = db.Column(db.Date, nullable=False)  # 雇用保険満了日
    
    # 登録・更新情報
    registration_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # 登録日時
    registered_by = db.Column(db.String(100), nullable=False)  # 登録者名
    last_modified_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)  # 最終更新日時
    modified_by = db.Column(db.String(100), nullable=False)  # 更新者名 