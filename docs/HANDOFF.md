# 開発の引き継ぎメモ(進捗記録)

最終更新: 2026-07-18 / ブランチ: main が本番(Vercel「nb」→ nb-sooty.vercel.app)

## これは何
株式会社ニュービルドの給料計算 PWA。Next.js 14 + React + TypeScript + Tailwind。
本番デプロイは Vercel(GitHub main を自動デプロイ)。

## 全コードの所在
すべての変更は GitHub `newbuild2020/nb` の main に commit 済み。
git 履歴が進捗記録そのもの(各コミットに変更内容を日本語で記載)。
ローカル開発へ移る場合は zip ではなく git clone で最新を取得すること。

## 現在のアーキテクチャ
- フロント: `app/`(App Router) — `/`(ログイン+ホーム)、`/people`、`/salary`、`/salary/records`
- ロジック: `app/lib/`
  - `payroll.ts` 給与計算エンジン / `payrollRates.ts` 2016〜2026年度の公式料率・税額式
  - `jpHolidays.ts` 祝日・支給日調整 / `peopleStore.ts` `salaryStore.ts` `settingsStore.ts`
  - `auth.ts`(newbuild/newbuild・前端のみ) / `cloudSync.ts` `supabaseClient.ts`
- データ: localStorage(作業用)+ Supabase(クラウド同期)。
  クラウドは people / salary_records の2テーブル、いずれも {id, data(jsonb), updated_at}。
  全業務フィールドは data(jsonb)内。削除は data.deleted=true の墓標方式。

## 直近で実施した主な変更(新しい順・抜粋)
- ホーム画面/ページ内アイコンの調整(ダークモード対応、最終は濃色背景+白ロゴ)
- 役員は給与項目を「役員報酬」表記に(計算は給与所得と同一)
- 国保組合にも子ども・子育て支援金の入力を追加(令和8年4月分〜、年齢制限なし、
  全額本人負担、税引き前控除)。介護分入力は勤務月時点40〜64歳のみ表示
- 役員の雇用保険・労災「役員対象外」表記を全画面で統一
- 明細一覧: 区分列追加 / 管理番号順(役員NB-01→社員NB-001) / 詳細へ自動スクロール /
  控除内訳の列とグループ合計行 / 控除額にマイナス符号
- 控除項目の並びを正規の給与明細順に統一(全画面・Excel)
- 金額セルの改行禁止、入力欄の高さ42px統一
- 日付/月入力の根本修正(iOS固有幅の無効化)、全ページのテーマ自動追従(ライト/ダーク)
- 編集の戻り先を明細一覧にし表示状態を復元

## NBCore サーバー移行(準備のみ・未適用)
- 自社サーバー(ConoHa)+ MariaDB(DB名 nbcore)へ移行する構想あり。
  ※ 接続情報・認証情報はセキュリティのためリポジトリには記載しない(手元管理)。
- バックアップJSON → MariaDB 変換SQLを作成しユーザーへ送付済み(ローカル保存のみ、未実行)。
  - テーブル: `biz_people`(13列)/ `biz_salary_records`(62列、全フィールドを列展開)
  - 符号ルール: 控除(健保・介護・厚年・雇用・所得税・支援金本人・組合費・県連共済費・
    年末調整徴収・控除合計)はDBにマイナス値で格納。総支給・還付・手取り・会社負担は正。
  - 変換スクリプトはこのリポジトリ外(セッションのscratchpad)にあるため、
    継続する場合はバックアップJSONから再生成する。

## 未決定・今後の検討事項
- Supabase から NBCore(MariaDB)へ移行するか、後端APIを新規に作るか(方針未確定)
- 認証の本格化(現状は前端のみの簡易ゲート)
- 43都道府県の協会けんぽ料率(令和8年度)は未確認分がR7値のまま
  (会社所在地=神奈川は確定値。毎年2/15の定期タスクで更新運用)

## ローカルでの動かし方
```
git clone https://github.com/newbuild2020/nb.git
cd nb
npm install
npm run dev     # http://localhost:3000
```
ログイン: newbuild / newbuild
