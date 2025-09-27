/**
 * ⚠️ ACADEMIC RESEARCH USE ONLY
 * For authorized testing environments that comply with all applicable laws.
 * See: https://github.com/botswin/FakeVision-Reverse/blob/main/DISCLAIMER.md
 */

import { parse, traverse, types } from "@babel/core";
import { CodeGenerator } from "@babel/generator";
import fs from "fs/promises";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
    headless: true,
});

const page = await browser.newPage();
const waitMainJsPromise = page.waitForResponse((resp) =>
    resp.url().includes("main.js")
);
await page.goto("https://fv.pro");

const mainJsResponse = await waitMainJsPromise;
const mainJsContent = await mainJsResponse.text();
await page.close();

console.log(`main.js loaded with url: ${mainJsResponse.url()}`);
const ast = parse(mainJsContent);

// Use traverse to find function calls with only two arguments, each of which is a number, or an expression of a number, such as 1 + 2, or 1 * 2, 1 / 2, or -1.
const fnNames = new Set();
const fnCalls = new Set();

traverse(ast, {
    CallExpression(path) {
        const { node } = path;
        if (node.arguments.length === 2) {
            // Calculating the value of an expression by evaluate
            const arg1Value = path.get("arguments.0").evaluate();
            const arg2Value = path.get("arguments.1").evaluate();

            if (arg1Value.confident && arg2Value.confident) {
                const fnName = node.callee.name;
                fnNames.add(fnName);
                const fnCall = `${fnName}(${arg1Value.value}, ${arg2Value.value})`;
                fnCalls.add(fnCall);
            }
        }
    },
});

// Refactor the code, where the function is defined, and insert this function at the end of the whole file, so that the function is defined on the window
// For example, if you encounter a function definition
// function _0x22324b(a, b) {
// ...
// }
// Then memorize the implementation of this function and insert it at the end of the file

const fnImplNodes = [];
traverse(ast, {
    FunctionDeclaration(path) {
        const { node } = path;
        if (node.id && fnNames.has(node.id.name)) {
            fnImplNodes.push(node);
        }
    },
});

// Insert the function at the end of the file
ast.program.body.push(...fnImplNodes);

const { code: newMainJsContent } = new CodeGenerator(ast, {
    retainLines: true,
    retainFunctionParens: true,
}).generate();

// Reopen the page, intercept the request and return a new main.js
const newPage = await browser.newPage();
await newPage.setRequestInterception(true);
newPage.on("request", (req) => {
    if (req.url().includes("main.js")) {
        console.log("intercept main.js request");
        req.respond({
            status: 200,
            contentType: "application/javascript",
            body: newMainJsContent,
        });
    } else {
        req.continue();
    }
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

await newPage.goto("https://fv.pro");
await sleep(3_000);

// Call these functions directly in the page to get the results.
const fnCallResults = await newPage.evaluate((fnCalls) => {
    const results = {};
    for (const fnCall of fnCalls) {
        try {
            results[fnCall] = eval(fnCall);
        } catch (err) { }
    }
    return results;
}, Array.from(fnCalls));

await browser.close();

// Replace the result back to the original code
traverse(ast, {
    CallExpression(path) {
        const { node } = path;
        if (node.arguments.length === 2) {
            const arg1Value = path.get("arguments.0").evaluate();
            const arg2Value = path.get("arguments.1").evaluate();

            if (arg1Value.confident && arg2Value.confident) {
                const fnName = node.callee.name;
                const fnCall = `${fnName}(${arg1Value.value}, ${arg2Value.value})`;
                if (fnCall in fnCallResults) {
                    path.replaceWithSourceString(
                        JSON.stringify(fnCallResults[fnCall])
                    );
                }
            }
        }
    },
});

// Remove function definitions that have been converted
const fnNamesToRemove = Array.from(
    new Set(
        Object.keys(fnCallResults).map((fnCall) => {
            return fnCall.split("(")[0];
        })
    )
);
traverse(ast, {
    FunctionDeclaration(path) {
        const { node } = path;
        if (node.id && fnNamesToRemove.includes(node.id.name)) {
            path.remove();
        }
    },
});

// Take all the expressions similar to this operation “0x2 * 0x36a + 0x6f0 + -0x371 * 0x4” and compute the results
traverse(ast, {
    BinaryExpression(path) {
        const { node } = path;
        const leftValue = path.get("left").evaluate();
        const rightValue = path.get("right").evaluate();

        if (
            leftValue.confident &&
            rightValue.confident &&
            typeof leftValue.value === "number" &&
            typeof rightValue.value === "number"
        ) {
            // Calculate the result directly
            const result = eval(
                `${leftValue.value} ${node.operator} ${rightValue.value}`
            );
            path.replaceWithSourceString(result.toString());
        }
    },
});

// For brackets read dots
traverse(ast, {
    MemberExpression(path) {
        if (types.isStringLiteral(path.node.property)) {
            const name = path.node.property.value;
            if (/^(?!\d)[\w$]+$/.test(name)) {
                path.node.property = types.identifier(name);
                path.node.computed = false;
            }
        }
    },
});

const { code: finalMainJsContent } = new CodeGenerator(ast).generate();
await fs.writeFile("final-main.js", finalMainJsContent);
console.log("final main js saved");
process.exit(0);
