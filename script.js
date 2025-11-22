const display = document.getElementById('display');
const calcApproxBtn = document.getElementById('calcApprox');
const calcExactBtn = document.getElementById('calcExact');
const clearBtn = document.getElementById('clearBtn');
const deleteBtn = document.getElementById('deleteBtn');
const stepsDiv = document.getElementById('steps');
const resultDiv = document.getElementById('result');

let currentExpression = '';

document.querySelectorAll('.key').forEach(key => {
    if (!key.id) {
        key.addEventListener('click', () => {
            const value = key.dataset.value;
            
            if (value === 'sqrt') {
                currentExpression += 'sqrt(';
            } else if (value === 'pow2') {
                currentExpression += '^2';
            } else if (value === 'abs') {
                currentExpression += '||';
                setTimeout(() => {
                    const cursorPos = currentExpression.length - 1;
                    display.textContent = currentExpression;
                }, 10);
                return;
            } else {
                currentExpression += value;
            }
            
            display.textContent = currentExpression;
        });
    }
});

clearBtn.addEventListener('click', () => {
    currentExpression = '';
    display.textContent = '';
    stepsDiv.style.display = 'none';
    resultDiv.style.display = 'none';
    stepsDiv.innerHTML = '';
});

deleteBtn.addEventListener('click', () => {
    currentExpression = currentExpression.slice(0, -1);
    display.textContent = currentExpression;
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

function calculateApproximate(expr) {
    const steps = [];
    let current = expr.trim();
    let stepNum = 1;

    current = current.replace(/\^2/g, '**2');
    current = current.replace(/\|([^|]+)\|/g, 'abs($1)');
    
    steps.push({
        num: stepNum++,
        text: `عبارت اصلی`,
        content: expr
    });

    let tempExpr = current;
    const sqrtMatches = [...tempExpr.matchAll(/sqrt\(([^()]+)\)/g)];
    sqrtMatches.forEach(match => {
        const inside = match[1];
        try {
            const value = safeMath(inside);
            const sqrtValue = Math.sqrt(value);
            steps.push({
                num: stepNum++,
                text: `محاسبه جذر`,
                content: `√(${inside}) = √(${value}) ≈ ${sqrtValue.toFixed(4)}`
            });
        } catch(e) {}
    });

    const absMatches = [...expr.matchAll(/\|([^|]+)\|/g)];
    absMatches.forEach(match => {
        const inside = match[1];
        try {
            let evalInside = inside.replace(/\^2/g, '**2');
            evalInside = evalInside.replace(/sqrt\(/g, 'Math.sqrt(');
            const value = eval(evalInside);
            const absValue = Math.abs(value);
            steps.push({
                num: stepNum++,
                text: `محاسبه قدر مطلق`,
                content: `|${inside}| = |${value.toFixed(4)}| = ${absValue.toFixed(4)}`
            });
        } catch(e) {}
    });

    const finalResult = safeMath(current);
    
    steps.push({
        num: stepNum++,
        text: `نتیجه نهایی (تقریبی)`,
        content: `${finalResult.toFixed(4)}`
    });

    return { steps, result: finalResult.toFixed(4) };
}

function calculateExact(expr) {
    const steps = [];
    let stepNum = 1;

    steps.push({
        num: stepNum++,
        text: `عبارت اصلی`,
        content: expr
    });

    const absMatches = [...expr.matchAll(/\|([^|]+)\|/g)];
    
    absMatches.forEach(match => {
        const inside = match[1];
        try {
            let evalInside = inside.replace(/\^2/g, '**2');
            evalInside = evalInside.replace(/sqrt\(/g, 'Math.sqrt(');
            const value = eval(evalInside);
            
            steps.push({
                num: stepNum++,
                text: `محاسبه داخل قدرمطلق`,
                content: `${inside} = ${value.toFixed(4)}`
            });

            if (value >= 0) {
                steps.push({
                    num: stepNum++,
                    text: `بدون قدرمطلق`,
                    content: `چون ${value.toFixed(4)} مثبت است، نتیجه: ${inside}`
                });
            } else {
                steps.push({
                    num: stepNum++,
                    text: `بدون قدرمطلق`,
                    content: `چون ${value.toFixed(4)} منفی است، نتیجه: -(${inside})`
                });
            }
        } catch(e) {}
    });

    let finalExpr = expr.replace(/\^2/g, '**2');
    finalExpr = finalExpr.replace(/sqrt\(/g, 'Math.sqrt(');
    finalExpr = finalExpr.replace(/\|([^|]+)\|/g, (match, p1) => {
        try {
            const val = eval(p1);
            return val >= 0 ? `(${p1})` : `-(${p1})`;
        } catch(e) {
            return match;
        }
    });

    try {
        const result = eval(finalExpr);
        steps.push({
            num: stepNum++,
            text: `نتیجه نهایی (بدون قدرمطلق)`,
            content: `${result.toFixed(4)}`
        });
        return { steps, result: result.toFixed(4) };
    } catch(e) {
        return { steps, result: 'خطا در محاسبه' };
    }
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

calcApproxBtn.addEventListener('click', () => {
    if (!currentExpression.trim()) {
        stepsDiv.innerHTML = '<div class="error">لطفاً عبارتی وارد کنید</div>';
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        return;
    }

    try {
        const { steps, result } = calculateApproximate(currentExpression);
        displaySteps(steps);
        resultDiv.textContent = `نتیجه تقریبی: ${result}`;
        resultDiv.style.display = 'block';
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">خطا در محاسبه! لطفاً عبارت را بررسی کنید</div>`;
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }
});

calcExactBtn.addEventListener('click', () => {
    if (!currentExpression.trim()) {
        stepsDiv.innerHTML = '<div class="error">لطفاً عبارتی وارد کنید</div>';
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
        return;
    }

    try {
        const { steps, result } = calculateExact(currentExpression);
        displaySteps(steps);
        resultDiv.textContent = `نتیجه بدون قدرمطلق: ${result}`;
        resultDiv.style.display = 'block';
        resultDiv.style.background = '#9b59b6';
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">خطا در محاسبه! لطفاً عبارت را بررسی کنید</div>`;
        stepsDiv.style.display = 'block';
        resultDiv.style.display = 'none';
    }
    
    setTimeout(() => {
        resultDiv.style.background = '#27ae60';
    }, 100);
});
