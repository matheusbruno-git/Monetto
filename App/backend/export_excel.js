// export_excel.js

const ExcelJS = require("exceljs");

/**
 * Export multiple datasets into one Excel workbook.
 *
 * Example:
 *
 * await exportToExcel({
 *   nomeArquivo: "relatorio_monetto.xlsx",
 *   sheets: [
 *     {
 *       nome: "Resumo",
 *       dados: [...]
 *     },
 *     {
 *       nome: "Turmas",
 *       dados: [...]
 *     }
 *   ]
 * });
 */
async function exportToExcel(opcoes = {}) {
    try {

        const {
            nomeArquivo = "monetto_export.xlsx",
            sheets = []
        } = opcoes;

        if (!Array.isArray(sheets) || sheets.length === 0) {
            throw new Error(
                "Nenhuma planilha foi fornecida para exportação."
            );
        }

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Monetto";
        workbook.lastModifiedBy = "Monetto";
        workbook.created = new Date();
        workbook.modified = new Date();

        // ---------------------------------------------------------
        // Create each worksheet
        // ---------------------------------------------------------

        for (const sheetData of sheets) {

            if (!sheetData || typeof sheetData !== "object") {
                continue;
            }

            const nomePlanilha =
                sheetData.nome ||
                `Planilha ${workbook.worksheets.length + 1}`;

            const dados =
                Array.isArray(sheetData.dados)
                    ? sheetData.dados
                    : [];

            const worksheet =
                workbook.addWorksheet(
                    nomePlanilha.substring(0, 31)
                );

            // Empty sheet
            if (dados.length === 0) {

                worksheet.addRow([
                    "Nenhum dado disponível"
                ]);

                worksheet.getRow(1).font = {
                    italic: true
                };

                continue;
            }

            // -----------------------------------------------------
            // Find every possible column
            // -----------------------------------------------------

            const colunas = [];

            for (const item of dados) {

                if (!item || typeof item !== "object") {
                    continue;
                }

                for (const chave of Object.keys(item)) {

                    if (!colunas.includes(chave)) {
                        colunas.push(chave);
                    }

                }
            }

            if (colunas.length === 0) {
                worksheet.addRow([
                    "Nenhum dado disponível"
                ]);
                continue;
            }

            // -----------------------------------------------------
            // Columns
            // -----------------------------------------------------

            worksheet.columns = colunas.map(chave => ({
                header: formatarCabecalho(chave),
                key: chave,
                width: calcularLarguraColuna(dados, chave)
            }));

            // -----------------------------------------------------
            // Rows
            // -----------------------------------------------------

            for (const item of dados) {

                const linha = {};

                for (const chave of colunas) {

                    let valor = item[chave];

                    if (
                        valor === null ||
                        valor === undefined
                    ) {
                        valor = "";
                    }

                    if (valor instanceof Date) {
                        linha[chave] = valor;
                    }

                    else if (
                        typeof valor === "object"
                    ) {
                        linha[chave] =
                            JSON.stringify(valor);
                    }

                    else {
                        linha[chave] = valor;
                    }
                }

                worksheet.addRow(linha);
            }

            // -----------------------------------------------------
            // Header
            // -----------------------------------------------------

            const headerRow =
                worksheet.getRow(1);

            headerRow.font = {
                bold: true
            };

            headerRow.alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            headerRow.height = 25;

            // -----------------------------------------------------
            // Freeze header
            // -----------------------------------------------------

            worksheet.views = [
                {
                    state: "frozen",
                    ySplit: 1
                }
            ];

            // -----------------------------------------------------
            // Filters
            // -----------------------------------------------------

            worksheet.autoFilter = {
                from: "A1",
                to:
                    `${numeroColunaExcel(colunas.length)}1`
            };

            // -----------------------------------------------------
            // Date formatting
            // -----------------------------------------------------

            worksheet.eachRow(
                (row, rowNumber) => {

                    if (rowNumber === 1) {
                        return;
                    }

                    row.eachCell(cell => {

                        if (
                            cell.value instanceof Date
                        ) {
                            cell.numFmt =
                                "dd/mm/yyyy hh:mm";
                        }

                    });

                }
            );
        }

        // ---------------------------------------------------------
        // Save workbook
        // ---------------------------------------------------------

        await workbook.xlsx.writeFile(
            nomeArquivo
        );

        console.log(
            `Excel criado com sucesso: ${nomeArquivo}`
        );

        return nomeArquivo;

    } catch (error) {

        console.error(
            "Erro ao exportar Excel:",
            error
        );

        throw error;
    }
}


// ===============================================================
// Format headers
// ===============================================================

function formatarCabecalho(chave) {

    if (!chave) {
        return "";
    }

    return chave
        .replace(/_/g, " ")
        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )
        .replace(
            /\b\w/g,
            letra => letra.toUpperCase()
        );
}


// ===============================================================
// Calculate column width
// ===============================================================

function calcularLarguraColuna(
    dados,
    chave
) {

    let maior =
        formatarCabecalho(chave).length;

    for (const item of dados) {

        let valor = item?.[chave];

        if (
            valor === null ||
            valor === undefined
        ) {
            valor = "";
        }

        if (
            typeof valor === "object"
        ) {
            valor = JSON.stringify(valor);
        }

        const tamanho =
            String(valor).length;

        if (tamanho > maior) {
            maior = tamanho;
        }
    }

    return Math.min(
        Math.max(maior + 2, 10),
        50
    );
}


// ===============================================================
// Excel column number → letters
// ===============================================================

function numeroColunaExcel(numero) {

    let resultado = "";

    while (numero > 0) {

        const resto =
            (numero - 1) % 26;

        resultado =
            String.fromCharCode(
                65 + resto
            ) + resultado;

        numero =
            Math.floor(
                (numero - 1) / 26
            );
    }

    return resultado;
}


// ===============================================================
// Export
// ===============================================================

module.exports = {
    exportToExcel
};
