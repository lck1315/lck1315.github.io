const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ["이름", "나이", "부서"],
  ["홍길동", 30, "개발팀"],
  ["김철수", 25, "디자인팀"]
]);

XLSX.utils.book_append_sheet(wb, ws, "시트1");
XLSX.writeFile(wb, "test.xlsx");
console.log("test.xlsx 생성 완료");
