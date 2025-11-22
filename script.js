const display = document.getElementById('display');
const calculateBtn = document.getElementById('calculateBtn');
const stepsDiv = document.getElementById('steps');
const resultDiv = document.getElementById('result');
const resultOptions = document.getElementById('resultOptions');
const keys = document.querySelectorAll('.key');

let currentExpression = '';
let calculatedSteps = [];
let finalValue = null;

keys.forEach(key => {
    key.addEventListener('click', () => {
        const value = key.dataset.value;
        
        if (key.classList.contains('clear')) {
            currentExpression = '';
            display.value = '';
            stepsDiv.innerHTML = '';
            stepsDiv.style.display = 'none';
            resultDiv.style.display = 'none';
            resultOptions.style.display = 'none';
        } else if (key.classList.contains('delete')) {
            currentExpression = currentExpression.slice(0, -1);
            display.value = currentExpression;
        } else if (value === 'sqrt') {
            currentExpression += 'sqrt(';
            display.value = currentExpression;
        } else if (value === 'pow') {
            currentExpression += '^2';
            display.value = currentExpression;
        } else if (value === 'abs') {
            currentExpression += '||';
            display.value = currentExpression;
        } else {
            currentExpression += value;
            display.value = currentExpression;
        }
    });
});

function safeMath(expr) {
    const math = {
        sqrt: Math.sqrt,
        pow: Math.pow,
        abs: Math.abs,
        PI: Math.PI,
        E: Math.E
    };
    
    try {
        return Function(...Object.keys(math), `"use strict"; return (${expr});`)(...Object.values(math));
    } catch (e) {
        throw new Error('خطا در محاسبه');
    }
}

function validateExpression(expr) {
    const openAbs = (expr.match(/\|/g) || []).length;
    if (openAbs % 2 !== 0) {
        throw new Error('تعداد علامت قدر مطلق باید زوج باشد');
    }
    
    let openParen = 0;
    for (let char of expr) {
        if (char === '(') openParen++;
        if (char === ')') openParen--;
        if (openParen < 0) throw new Error('پرانتزها نادرست هستند');
    }
    if (openParen !== 0) throw new Error('پرانتزها بسته نشده‌اند');
    
    return true;
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

    while (current.includes('sqrt(') || /\*\*\d+/.test(current)) {
        let modified = false;

        const sqrtMatch = current.match(/sqrt\(([^()]+)\)/);
        if (sqrtMatch) {
            const inside = sqrtMatch[1];
            const value = safeMath(inside);
            const sqrtValue = Math.sqrt(value);
            
            steps.push({
                num: stepNum++,
                text: `محاسبه جذر`,
                content: `sqrt(${inside}) = sqrt(${value}) = ${sqrtValue.toFixed(4)}`
            });

            current = current.replace(sqrtMatch[0], sqrtValue);
            modified = true;
        }

        const powMatch = current.match(/([0-9.]+)\*\*(\d+)/);
        if (powMatch) {
            const base = parseFloat(powMatch[1]);
            const exp = parseInt(powMatch[2]);
            const powValue = Math.pow(base, exp);
            
            steps.push({
                num: stepNum++,
                text: `محاسبه توان`,
                content: `${base}^${exp} = ${powValue}`
            });

            current = current.replace(powMatch[0], powValue);
            modified = true;
        }

        if (modified) {
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
        
        const regex = /\|([^|]+)\|/;
        const match = current.match(regex);
        
        if (!match) break;

        const inside = match[1];
        const value = safeMath(inside);
        const absValue = Math.abs(value);

        steps.push({
            num: stepNum++,
            text: `محاسبه قدر مطلق`,
            content: `|${inside}| = |${value}| = ${absValue}`
        });

        current = current.replace(match[0], absValue);
        
        steps.push({
            num: stepNum++,
            text: `عبارت جدید`,
            content: current
        });
    }

    if (current.match(/[+\-*/]/)) {
        const beforeFinal = current;
        const finalCalc = safeMath(current);
        steps.push({
            num: stepNum++,
            text: `محاسبه نهایی`,
            content: `${beforeFinal} = ${finalCalc.toFixed(4)}`
        });
    }

    const finalResult = safeMath(current);
    
    return { steps, result: finalResult };
}

function displaySteps(stepsArray) {
    stepsDiv.innerHTML = '';
    stepsDiv.style.display = 'block';
    stepsArray.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.innerHTML = `
            <span class="step-number">مرحله ${step.num}: ${step.text}</span>
            <div class="step-content">${step.content}</div>
        `;
        stepsDiv.appendChild(stepDiv);
    });
}

function calculate() {
    const expression = currentExpression.trim();
    
    if (!expression) {
        stepsDiv.innerHTML = '<div class="error">لطفاً یک عبارت وارد کنید</div>';
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        resultOptions.style.display = 'none';
        return;
    }

    try {
        validateExpression(expression);
        const { steps, result } = parseExpression(expression);
        calculatedSteps = steps;
        finalValue = result;
        
        displaySteps(steps);
        resultOptions.style.display = 'block';
        resultDiv.style.display = 'none';
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">خطا: ${error.message}</div>`;
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        resultOptions.style.display = 'none';
    }
}

calculateBtn.addEventListener('click', calculate);

display.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculate();
});

document.getElementById('showApprox').addEventListener('click', () => {
    if (finalValue !== null) {
        resultDiv.textContent = `نتیجه تقریبی: ${finalValue.toFixed(4)}`;
        resultDiv.style.display = 'block';
    }
});

document.getElementById('showWithoutAbs').addEventListener('click', () => {
    if (finalValue !== null) {
        const exprWithoutAbs = currentExpression.replace(/\|/g, '');
        try {
            const processed = exprWithoutAbs.replace(/\^2/g, '**2');
            const valueWithoutAbs = safeMath(processed);
            resultDiv.textContent = `بدون قدر مطلق: ${valueWithoutAbs.toFixed(4)}`;
            resultDiv.style.display = 'block';
        } catch (e) {
            resultDiv.textContent = `خطا در محاسبه بدون قدر مطلق`;
            resultDiv.style.display = 'block';
        }
    }
});

document.getElementById('showWithAbs').addEventListener('click', () => {
    if (finalValue !== null) {
        resultDiv.textContent = `با قدر مطلق: ${Math.abs(finalValue).toFixed(4)}`;
        resultDiv.style.display = 'block';
    }
});
