const display = document.getElementById('display');
const calculateBtn = document.getElementById('calculateBtn');
const clearBtn = document.getElementById('clearBtn');
const deleteBtn = document.getElementById('deleteBtn');
const outputSection = document.getElementById('outputSection');
const approxResult = document.getElementById('approxResult');
const exactResult = document.getElementById('exactResult');
const stepsDiv = document.getElementById('steps');

let currentExpression = '';
let insideAbsolute = false;

document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', () => {
        const value = key.getAttribute('data-value');
        if (value) {
            handleInput(value);
        }
    });
});

clearBtn.addEventListener('click', () => {
    currentExpression = '';
    insideAbsolute = false;
    display.textContent = '';
    outputSection.style.display = 'none';
    stepsDiv.style.display = 'none';
});

deleteBtn.addEventListener('click', () => {
    if (currentExpression.length > 0) {
        const lastChar = currentExpression[currentExpression.length - 1];
        if (lastChar === '|') {
            insideAbsolute = !insideAbsolute;
        }
        currentExpression = currentExpression.slice(0, -1);
        display.textContent = currentExpression;
    }
});

function handleInput(value) {
    if (value === '|') {
        currentExpression += '|';
        insideAbsolute = !insideAbsolute;
    } else if (value === 'sqrt') {
        currentExpression += '√(';
    } else if (value === '^2') {
        currentExpression += '^2';
    } else {
        currentExpression += value;
    }
    display.textContent = currentExpression;
}

function validateExpression(expr) {
    let pipeCount = 0;
    let parenCount = 0;
    
    for (let char of expr) {
        if (char === '|') pipeCount++;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
    }
    
    if (pipeCount % 2 !== 0) {
        throw new Error('قدرمطلق‌ها باید به صورت جفت باشند');
    }
    
    if (parenCount !== 0) {
        throw new Error('پرانتزها باید به صورت صحیح بسته شوند');
    }
    
    return true;
}

function safeMath(expr) {
    const math = {
        sqrt: Math.sqrt,
        pow: Math.pow,
        abs: Math.abs,
        PI: Math.PI
    };
    
    try {
        return Function(...Object.keys(math), `"use strict"; return (${expr});`)(...Object.values(math));
    } catch (e) {
        throw new Error('خطا در محاسبه');
    }
}

function parseExpression(expr) {
    let processed = expr;
    const steps = [];
    let stepNum = 1;

    processed = processed.replace(/√/g, 'sqrt');
    processed = processed.replace(/\^2/g, '**2');
    processed = processed.replace(/×/g, '*');

    steps.push({
        num: stepNum++,
        text: 'عبارت اصلی',
        content: expr
    });

    while (processed.includes('sqrt(')) {
        const match = processed.match(/sqrt\(([^()]+)\)/);
        if (match) {
            const inside = match[1];
            const value = safeMath(inside);
            const sqrtValue = Math.sqrt(value);
            
            steps.push({
                num: stepNum++,
                text: 'محاسبه جذر',
                content: `√(${inside}) = √${value} = ${sqrtValue.toFixed(4)}`
            });

            processed = processed.replace(match[0], sqrtValue);
        } else {
            break;
        }
    }

    while (processed.includes('**2')) {
        const match = processed.match(/(\d+\.?\d*)\*\*2/);
        if (match) {
            const base = parseFloat(match[1]);
            const result = base ** 2;
            
            steps.push({
                num: stepNum++,
                text: 'محاسبه توان دوم',
                content: `${base}² = ${result}`
            });

            processed = processed.replace(match[0], result);
        } else {
            break;
        }
    }

    let withoutAbs = processed;
    let iteration = 0;
    
    while (processed.includes('|') && iteration < 50) {
        iteration++;
        const match = processed.match(/\|([^|]+)\|/);
        
        if (!match) break;

        const inside = match[1];
        const value = safeMath(inside);
        const absValue = Math.abs(value);

        steps.push({
            num: stepNum++,
            text: 'محاسبه قدرمطلق',
            content: `|${inside}| = |${value.toFixed(4)}| = ${absValue.toFixed(4)}`
        });

        processed = processed.replace(match[0], absValue);
        withoutAbs = withoutAbs.replace(match[0], value);
    }

    const finalApprox = safeMath(processed);
    const finalExact = safeMath(withoutAbs);

    return { 
        steps, 
        approx: finalApprox, 
        exact: finalExact 
    };
}

function displaySteps(stepsArray) {
    stepsDiv.innerHTML = '<h3 style="color: #333; margin-bottom: 15px;">مراحل محاسبه:</h3>';
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
    if (!currentExpression) {
        alert('لطفاً یک عبارت وارد کنید');
        return;
    }

    try {
        validateExpression(currentExpression);
        
        const { steps, approx, exact } = parseExpression(currentExpression);
        
        approxResult.textContent = approx.toFixed(4);
        exactResult.textContent = exact.toFixed(4);
        
        outputSection.style.display = 'block';
        displaySteps(steps);
        
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">${error.message}</div>`;
        stepsDiv.style.display = 'block';
        outputSection.style.display = 'none';
    }
});
