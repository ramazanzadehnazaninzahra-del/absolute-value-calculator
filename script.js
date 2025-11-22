const equationInput = document.getElementById('equation');
const calculateBtn = document.getElementById('calculateBtn');
const stepsDiv = document.getElementById('steps');
const resultDiv = document.getElementById('result');

function safeMath(expr) {
    const math = {
        sqrt: Math.sqrt,
        pow: Math.pow,
        abs: Math.abs,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log,
        exp: Math.exp,
        PI: Math.PI,
        E: Math.E
    };
    
    try {
        return Function(...Object.keys(math), `"use strict"; return (${expr});`)(...Object.values(math));
    } catch (e) {
        throw new Error('خطا در محاسبه');
    }
}

function parseAbsolute(expr) {
    const steps = [];
    let current = expr.trim();
    let stepNum = 1;

    current = current.replace(/\^(\d+)/g, '**$1');
    
    steps.push({
        num: stepNum++,
        text: `معادله اصلی`,
        content: current
    });

    while (current.includes('sqrt(') || current.includes('pow(')) {
        let modified = false;

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
            modified = true;
        }

        const powMatch = current.match(/pow\(([^,()]+),\s*([^,()]+)\)/);
        if (powMatch) {
            const base = powMatch[1];
            const exp = powMatch[2];
            const baseValue = safeMath(base);
            const expValue = safeMath(exp);
            const powValue = Math.pow(baseValue, expValue);
            
            steps.push({
                num: stepNum++,
                text: `محاسبه توان`,
                content: `pow(${base}, ${exp}) = pow(${baseValue}, ${expValue}) = ${powValue}`
            });

            current = current.replace(powMatch[0], powValue);
            modified = true;
        }

        if (modified) {
            steps.push({
                num: stepNum++,
                text: `معادله جدید`,
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
            text: `معادله جدید`,
            content: current
        });
    }

    const finalResult = safeMath(current);
    
    return { steps, result: finalResult };
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
}

function calculate() {
    const equation = equationInput.value.trim();
    
    if (!equation) {
        stepsDiv.innerHTML = '<div class="error">لطفاً یک معادله وارد کنید</div>';
        resultDiv.style.display = 'none';
        return;
    }

    try {
        const { steps, result } = parseAbsolute(equation);
        displaySteps(steps);
        resultDiv.textContent = `نتیجه نهایی: ${result}`;
        resultDiv.style.display = 'block';
    } catch (error) {
        stepsDiv.innerHTML = `<div class="error">خطا در محاسبه! لطفاً معادله را بررسی کنید<br>${error.message}</div>`;
        resultDiv.style.display = 'none';
    }
}

calculateBtn.addEventListener('click', calculate);
equationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') calculate();
});
