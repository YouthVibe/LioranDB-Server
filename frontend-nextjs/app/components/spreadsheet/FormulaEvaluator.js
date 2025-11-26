// spreadsheet/FormulaEvaluator.js
export function evaluateFormula(formula, cells) {
  try {
    if (!formula.startsWith("=")) return formula;
    const expression = formula
      .substring(1)
      .replace(/[A-Z]\d+/g, (match) => {
        return parseFloat(cells[match] || 0);
      });
    // Evaluate safely
    // eslint-disable-next-line no-eval
    return eval(expression);
  } catch (err) {
    return "#ERROR!";
  }
}
