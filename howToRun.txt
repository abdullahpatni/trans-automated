playwright open --save-storage ivcargo.json --browser firefox
go to url and close the applications it will save to json file


npx playwright codegen --browser=firefox --load-storage=ivcargo.json "https://ivcargo.in/ivcargo/CashStatementReport.do?pageId=50&eventId=156&tab=1"


npx playwright test tests/example.spec.ts --headed