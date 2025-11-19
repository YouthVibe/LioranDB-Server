import XLSX from "xlsx-js-style";
function stox(wb){var out=[];wb.SheetNames.forEach(function(name){var o={name:name,rows:{}};var ws=wb.Sheets[name];if(!ws||!ws["!ref"])return;var range=XLSX.utils.decode_range(ws["!ref"]);range.s={r:0,c:0};var aoa=XLSX.utils.sheet_to_json(ws,{raw:false,header:1,range:range});aoa.forEach(function(r,i){var cells={};r.forEach(function(c,j){cells[j]={text:c||String(c)};var cellRef=XLSX.utils.encode_cell({r:i,c:j});if(ws[cellRef]!=null&&ws[cellRef].f!=null){cells[j].text="="+ws[cellRef].f}});o.rows[i]={cells:cells}});o.rows.len=aoa.length;o.merges=[];(ws["!merges"]||[]).forEach(function(merge,i){if(o.rows[merge.s.r]==null){o.rows[merge.s.r]={cells:{}}}if(o.rows[merge.s.r].cells[merge.s.c]==null){o.rows[merge.s.r].cells[merge.s.c]={}}o.rows[merge.s.r].cells[merge.s.c].merge=[merge.e.r-merge.s.r,merge.e.c-merge.s.c];o.merges[i]=XLSX.utils.encode_range(merge)});out.push(o)});return out}function xtos(sdata){var out=XLSX.utils.book_new();sdata.forEach(function(xws){var ws={};var rowobj=xws.rows;var minCoord={r:0,c:0},maxCoord={r:0,c:0};for(var ri=0;ri<rowobj.len;++ri){var row=rowobj[ri];if(!row)continue;Object.keys(row.cells).forEach(function(k){var idx=+k;if(isNaN(idx))return;var lastRef=XLSX.utils.encode_cell({r:ri,c:idx});if(ri>maxCoord.r)maxCoord.r=ri;if(idx>maxCoord.c)maxCoord.c=idx;var cellText=row.cells[k].text,type="s";if(!cellText){cellText="";type="z"}else if(!isNaN(Number(cellText))){cellText=Number(cellText);type="n"}else if(cellText.toLowerCase()==="true"||cellText.toLowerCase()==="false"){cellText=Boolean(cellText);type="b"}ws[lastRef]={v:cellText,t:type};if(type=="s"&&cellText[0]=="="){ws[lastRef].f=cellText.slice(1)}if(row.cells[k].merge!=null){if(ws["!merges"]==null)ws["!merges"]=[];ws["!merges"].push({s:{r:ri,c:idx},e:{r:ri+row.cells[k].merge[0],c:idx+row.cells[k].merge[1]}})}})}ws["!ref"]=minCoord?XLSX.utils.encode_range({s:minCoord,e:maxCoord}):"A1";XLSX.utils.book_append_sheet(out,ws,xws.name)});return out}
// /**
//  * Convert XLSX workbook → x-data-spreadsheet JSON
//  * Preserves cell styles by building a styles array and using indices
//  */
// function stox(wb) {
//   const out = [];
//   wb.SheetNames.forEach(name => {
//     const o = { name, rows: {}, styles: [] };
//     const ws = wb.Sheets[name];
//     if (!ws || !ws["!ref"]) return;

//     const range = XLSX.utils.decode_range(ws["!ref"]);
//     range.s = { r: 0, c: 0 };

//     const aoa = XLSX.utils.sheet_to_json(ws, { raw: false, header: 1, range });
//     const styleMap = new Map(); // Map to deduplicate styles

//     aoa.forEach((r, i) => {
//       const cells = {};
//       r.forEach((c, j) => {
//         const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
//         const cellObj = ws[cellRef] || {};
//         let styleIndex = undefined;

//         // Handle styles
//         if (cellObj.s || i === 0) { // Apply styles to headers (row 0) or if s exists
//           const xlsStyle = cellObj.s || {};
//           let styleObj = {
//             font: {
//               bold: false,
//               italic: false,
//               name: "Arial",
//               size: 10,
//             },
//             bgcolor: xlsStyle.fill?.fgColor?.rgb ? `#${xlsStyle.fill.fgColor.rgb}` : undefined,
//             align: xlsStyle.alignment?.horizontal,
//           };

//           // Infer additional styles from CellXf for headers (row 0)
//           if (i === 0) {
//             const cellXfIndex = (j === 0) ? 1 : 2; // A1: CellXf[1], B1: CellXf[2] based on your wb
//             const cellXf = wb.Styles?.CellXf?.[cellXfIndex] || {};
//             if (cellXf) {
//               const fontId = cellXf.fontId || cellXf.fontid;
//               const fillId = cellXf.fillId || cellXf.fillid;
//               styleObj = {
//                 font: {
//                   bold: fontId === 1, // Font 1 is bold 14pt
//                   italic: false,
//                   name: "Arial",
//                   size: fontId === 1 ? 14 : 10,
//                 },
//                 bgcolor: wb.Styles?.Fills?.[fillId]?.fgColor?.rgb ? `#${wb.Styles.Fills[fillId].fgColor.rgb}` : styleObj.bgcolor,
//                 align: cellXf.alignment?.horizontal || undefined,
//               };
//             }
//           }

//           let styleStr = JSON.stringify(styleObj);

//           // Deduplicate styles
//           if (!styleMap.has(styleStr)) {
//             styleMap.set(styleStr, o.styles.length);
//             o.styles.push(JSON.parse(styleStr));
//           }
//           styleIndex = styleMap.get(styleStr);
//         }

//         cells[j] = {
//           text: cellObj.f ? "=" + cellObj.f : (c || ""),
//           style: styleIndex,
//         };
//       });
//       o.rows[i] = { cells };
//     });
//     o.rows.len = aoa.length;

//     o.merges = [];
//     (ws["!merges"] || []).forEach((merge, i) => {
//       if (!o.rows[merge.s.r]) o.rows[merge.s.r] = { cells: {} };
//       if (!o.rows[merge.s.r].cells[merge.s.c]) o.rows[merge.s.r].cells[merge.s.c] = {};
//       o.rows[merge.s.r].cells[merge.s.c].merge = [
//         merge.e.r - merge.s.r,
//         merge.e.c - merge.s.c
//       ];
//       o.merges[i] = XLSX.utils.encode_range(merge);
//     });

//     out.push(o);
//   });
//   return out;
// }

// /**
//  * Convert x-data-spreadsheet JSON → XLSX workbook
//  * Preserves cell styles in `.s` by resolving style indices
//  */
// function xtos(sdata) {
//   const out = XLSX.utils.book_new();

//   sdata.forEach(xws => {
//     const ws = {};
//     const rowobj = xws.rows;
//     const minCoord = { r: 0, c: 0 };
//     const maxCoord = { r: 0, c: 0 };

//     for (let ri = 0; ri < rowobj.len; ++ri) {
//       const row = rowobj[ri];
//       if (!row) continue;

//       Object.keys(row.cells).forEach(k => {
//         const idx = +k;
//         if (isNaN(idx)) return;

//         const lastRef = XLSX.utils.encode_cell({ r: ri, c: idx });
//         if (ri > maxCoord.r) maxCoord.r = ri;
//         if (idx > maxCoord.c) maxCoord.c = idx;

//         let cellText = row.cells[k].text;
//         let type = "s";

//         if (!cellText) {
//           cellText = "";
//           type = "z";
//         } else if (!isNaN(Number(cellText))) {
//           cellText = Number(cellText);
//           type = "n";
//         } else if (
//           cellText.toLowerCase() === "true" ||
//           cellText.toLowerCase() === "false"
//         ) {
//           cellText = Boolean(cellText);
//           type = "b";
//         }

//         ws[lastRef] = { v: cellText, t: type };

//         // formulas
//         if (type === "s" && cellText[0] === "=") ws[lastRef].f = cellText.slice(1);

//         // styles - resolve the style index to the actual style object
//         if (row.cells[k].style !== undefined && xws.styles && xws.styles[row.cells[k].style]) {
//           const styleIndex = row.cells[k].style;
//           const styleObj = xws.styles[styleIndex] || {};

//           // Map x-data-spreadsheet style to XLSX-compatible style
//           ws[lastRef].s = {
//             font: {
//               bold: styleObj.font?.bold || false,
//               italic: styleObj.font?.italic || false,
//               name: styleObj.font?.name || "Arial",
//               sz: styleObj.font?.size || 10,
//             },
//             fill: styleObj.bgcolor ? { fgColor: { rgb: styleObj.bgcolor.slice(1) } } : undefined,
//             alignment: styleObj.align ? { horizontal: styleObj.align } : undefined,
//             // Add more mappings as needed (e.g., border, underline)
//           };
//         }

//         // merges
//         if (row.cells[k].merge != null) {
//           if (!ws["!merges"]) ws["!merges"] = [];
//           ws["!merges"].push({
//             s: { r: ri, c: idx },
//             e: { r: ri + row.cells[k].merge[0], c: idx + row.cells[k].merge[1] }
//           });
//         }
//       });
//     }

//     ws["!ref"] = minCoord
//       ? XLSX.utils.encode_range({ s: minCoord, e: maxCoord })
//       : "A1";

//     XLSX.utils.book_append_sheet(out, ws, xws.name);
//   });

//   return out;
// }

export { stox, xtos };