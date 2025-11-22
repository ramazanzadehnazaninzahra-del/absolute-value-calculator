const display = document.getElementById('display');
const calculateBtn = document.getElementById('calculateBtn');
const clearBtn = document.getElementById('clearBtn');
const deleteBtn = document.getElementById('deleteBtn');
const stepsDiv = document.getElementById('steps');
const resultDiv = document.getElementById('result');
const resultOptions = document.getElementById('resultOptions');
const approxBtn = document.getElementById('approxBtn');
const exactBtn = document.getElementById('exactBtn');

let currentExpression = '';
let calculatedSteps = null;
let calculatedResult = null;

document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', function() {
        const value = this.getAttribute('data-value');
        
        if (value === 'sqrt') {
            currentExpression += 'sqrt(';
        } else if (value === 'pow') {
            currentExpression += '^2';
        } else if (value === 'abs') {
            // تغییر: استفاده از یک علامت | تکی به جای ||
            currentExpression += '|';
        } else if (value) {
            currentExpression += value;
        }
        
        updateDisplay();
    });
});

clearBtn.addEventListener('click', () => {
    currentExpression = '';
    updateDisplay();
    stepsDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    resultOptions.style.display = 'none';
    stepsDiv.innerHTML = '';
});

deleteBtn.addEventListener('click', () => {
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
});

function updateDisplay() {
    display.textContent = currentExpression || '0';
}

function validateExpression(expr) {
    if (!expr.trim()) {
        throw new Error('لطفاً عبارتی وارد کنید');
    }
    
    const openParen = (expr.match(/\(/g) || []).length;
    const closeParen = (expr.match(/\)/g) || []).length;
    
    if (openParen !== closeParen) {
        throw new Error('پرانتزها متعادل نیستند');
    }
    
    const pipes = (expr.match(/\|/g) || []).length;
    // تغییر: فقط بررسی کنیم تعداد علامت | زوج باشد
    if (pipes % 2 !== 0) {
        throw new Error('علامت قدر مطلق کامل نیست');
    }
    
    return true;
}

function safeMath(expr) {
    const math = {
        sqrt: Math.sqrt,
        pow: Math.pow,
        abs: Math.abs
    };
    
    try {
        return Function(...Object.keys(math), `"use strict"; return (${expr});`)(...Object.values(math));
    } catch (e) {
        throw new Error('خطا در محاسبه');
    }
}

function parseExpression(expr) {
    const steps = [];
    let current = expr.trim();
    let stepNum = 1;

    current = current.replace(/\^2/g, '**2');
    
    steps.push({
        num: stepNum++,
        text: `عبارت اصلی`,
        content: expr
    });

    while (current.includes('sqrt(')) {
        const sqrtMatch = current.match(/sqrt\(([^()]+)\)/);
        if (sqrtMatch) {
            const inside = sqrtMatch[1];
            const value = safeMath(inside);
            const sqrtValue = Math.sqrt(value);
            
            steps.push({
                num: stepNum++,
                text: `محاسبه جذر`,
                content: `sqrt(${inside}) = sqrt(${value}) = ${sqrtValue}`
            });

            current = current.replace(sqrtMatch[0], sqrtValue);
            
            steps.push({
                num: stepNum++,
                text: `عبارت جدید`,
                content: current
            });
        } else {
            break;
        }
    }

    let iteration = 0;
    while (current.includes('|') && iteration < 50) {
        iteration++;
        
        // تغییر: استفاده از regex که یک | باز و بعد محتوا را پیدا کند، بسته اختیاری
        const regex = /\|([^|]+)\|?/;
        const match = current.match(regex);
        
        if (!match) break;

        const inside = match[1];
        const value = safeMath(inside);
        const absValue = Math.abs(value);

        steps.push({
            num: stepNum++,
            text: `محاسبه قدر مطلق`,
            content: `|${inside}| = ${absValue}`
        });

        current = current.replace(match[0], absValue);
        
        steps.push({
            num: stepNum++,
            text: `عبارت جدید`,
            content: current
        });
    }

    const finalResult = safeMath(current);
    
    return { steps, result: finalResult, finalExpression: current };
}

function displaySteps(stepsArray) {
    stepsDiv.innerHTML = '';
    stepsArray.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.innerHTML = `
            <span class="step-number">مرحله ${step.num}: ${step.text}</span>
            <div class="step-content">${step.content}</div>
        `;
        stepsDiv.appendChild(stepDiv);
    });
    stepsDiv.style.display = 'block';
}

calculateBtn.addEventListener('click', () => {
    try {
        validateExpression(currentExpression);
        
        const parsed = parseExpression(currentExpression);
        calculatedSteps = parsed.steps;
        calculatedResult = parsed.result;
        
        displaySteps(calculatedSteps);
        
        resultOptions.style.display = 'block';
        resultDiv.style.display = 'none';
        
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">${error.message}</div>`;
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        resultOptions.style.display = 'none';
    }
});

approxBtn.addEventListener('click', () => {
    if (calculatedResult !== null) {
        resultDiv.textContent = `نتیجه تقریبی: ${calculatedResult.toFixed(4)}`;
        resultDiv.style.display = 'block';
    }
});

exactBtn.addEventListener('click', () => {
    if (calculatedResult !== null) {
        const originalExpr = currentExpression.replace(/\|/g, '').replace(/sqrt\(/g, 'Math.sqrt(').replace(/\^2/g, '**2');
        try {
            const exactValue = safeMath(originalExpr);
            resultDiv.textContent = `بدون قدر مطلق: ${exactValue}`;
            resultDiv.style.display = 'block';
        } catch (e) {
            resultDiv.textContent = `نتیجه: ${calculatedResult}`;
            resultDiv.style.display = 'block';
        }
    }
});

updateDisplay();
