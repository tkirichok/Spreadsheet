window.modeApp = 'view';

window.addEventListener("load", function () {

    for (var i = 0; i < 6; i++) {
        var row = document.querySelector("table").insertRow(-1);
        for (var j = 0; j < 15; j++) {
            var letter = String.fromCharCode("A".charCodeAt(0) + j - 1);
            row.insertCell(-1).innerHTML = i && j ? "<input id = '" + letter + i + "' class = 'view'/>" : i || ((letter != "@") ? letter : '');
        }
    }

    var inputs = [].slice.call(document.querySelectorAll("td > input"))
    var sheet = {}

    for (var k = 0; k < inputs.length; k++) {
        mainApp(inputs[k])
    }

    function mainApp(elm){
        //var elm = inputs[k]
        var obj = {}
        obj.formula = ""
        obj.rState = $R.state([''])
        obj.rFunction = $R(function () {
            var seq_out = arguments[0]
            var cells = getCellNames(seq_out)
            var stack = []
            var operators = {'^': 1, '%': 2, '*': 3, '/': 3, '+': 4, '-': 4, '(': 5, ')': 5}

            for (var i = 0; i < seq_out.length; i++) {
                var c = seq_out[i]
                if (operators[c]) {
                    var t = stack.pop()
                    if (c == '^') {
                        stack[stack.length - 1] = Math.pow(stack[stack.length - 1], t)
                    }
                    else if (c == '*') {
                        stack[stack.length - 1] *= t
                    }
                    else if (c == '/') {
                        stack[stack.length - 1] /= t
                    }
                    else if (c == '%') {
                        stack[stack.length - 1] = stack[stack.length - 1] % t
                    }
                    else if (c == '+') {
                        if (stack.length == 0) {
                            stack.push(t)
                        }
                        else {
                            stack[stack.length - 1] += t
                        }
                    }
                    else if (c == '-') {
                        if (stack.length == 0) {
                            stack.push(-t)
                        }
                        else {
                            stack[stack.length - 1] -= t
                        }
                    }
                }
                else if (c == '') {
                    stack.push(0)
                }
                else if (!isNaN(c)) {
                    stack.push((c.indexOf('.') != -1) ? parseFloat(c) : parseInt(c))
                }
                else if (sheet[c]) {
                    stack.push(arguments[cells.indexOf(c) + 1])
                }
                else {
                    console.log('error')
                }

            }

            return stack[0]
        })
        obj.rFunction.bindTo(obj.rState)
        sheet[elm.id] = obj
        $R.dom(elm).bindAttributeTo("value", obj.rFunction);
        //$('table').find(elm)
        $(elm).on("change", function () {
            sheet[this.id].formula = this.value
            var seqOut = parser(this.value)
            var cellNames = getCellNames(seqOut)
            var toBind = [sheet[this.id].rState]
            for (var i = 0; i < cellNames.length; i++) {
                toBind.push(sheet[cellNames[i]].rFunction)
            }
            sheet[this.id].rFunction.bindTo.apply(sheet[this.id].rFunction, toBind)
            sheet[this.id].rState.set(seqOut)
        })
        elm.readOnly = true
        elm.onblur = function (e) {
            e.target.className = 'view'
            e.target.readOnly = true
            e.target.blur()
            //e.target.focus()
            window.modeApp = "view"
            if (sheet[e.target.id].formula == '') {
                e.target.value = ''
            }
            else {
                e.target.value = sheet[e.target.id].rFunction()
            }
        }
        elm.onkeydown = function (e) {
            if (window.modeApp == "edit") {
                if ((e.keyCode == 13) || (e.keyCode == 9)) {
                    e.target.className = 'view'
                    e.target.readOnly = true
                    e.target.blur()
                    e.target.focus()
                    window.modeApp = "view"
                    if (sheet[e.target.id].formula == '') {
                        e.target.value = ''
                    }
                    else {
                        e.target.value = sheet[e.target.id].rFunction()
                    }
                }
            }
            else if ((e.keyCode == 113) || (e.keyCode == 13)) {
                e.target.readOnly = false
                e.target.focus()
                e.target.className = 'edit'
                e.target.value = sheet[e.target.id].formula
                window.modeApp = "edit"
                console.log('ok')
            }
        }


    }

    function parser(formula) {
        var operators = {'^': 1, '%': 2, '*': 3, '/': 3, '+': 4, '-': 4, '(': 5, ')': 5}

        var seq_in = []  //

        var dig = ''    // number in formula
        var varb = ''   // variable in formula
        var dot = false //for decimal point

        for (var i = 0; i < formula.length; i++) {
            var c = formula[i]
            if (c === ' ') {
                if (dig.length != 0) {
                    seq_in.push(['n', dig])
                    dig = ''
                    dot = false
                }
                else if (varb.length != 0) {
                    seq_in.push(['n', varb])
                    varb = ''
                }
            }
            else if (operators[c]) {
                if (dig.length != 0) {
                    seq_in.push(['n', dig])
                    dig = ''
                    dot = false
                }
                else if (varb.length != 0) {
                    seq_in.push(['n', varb])
                    varb = ''
                }

                if (c == '(') {
                    seq_in.push(['(', c])
                }
                else if (c == ')') {
                    seq_in.push([')', c])
                }
                else {
                    seq_in.push(['o', c])
                }

            }

            else if (!isNaN(c)) {
                if (varb.length != 0) {
                    varb += c
                }
                else {
                    dig += c
                }
            }

            else if (c.match(/[A-Za-z_]/g)) {
                if (dig.length != 0) {
                    console.log('error')
                }
                else {
                    varb += c
                }
            }

            else if (c == '.') {
                if ((dig.length != 0) & (!dot)) {
                    dig += c
                    dot = true
                }
                else {
                    console.log('error')
                }
            }

            else {
                console.log('error')
            }
        }

        if (dig.length != 0) {
            seq_in.push(['n', dig])
        }
        else if (varb.length != 0) {
            seq_in.push(['n', varb])
        }

        var stack = []
        var seq_out = []

        for (var i = 0; i < seq_in.length; i++) {
            var c = seq_in[i]
            switch (c[0]) {
                case 'n':
                    seq_out.push(c[1])
                    break
                case '(':
                    stack.push(c[1])
                    break
                case ')':
                    while (stack[stack.length - 1] != '(') {
                        seq_out.push(stack.pop())
                    }
                    stack.pop()
                    break
                case 'o':
                    while ((stack.length != 0) & (operators[c[1]] >= operators[stack[stack.length - 1]])) {
                        seq_out.push(stack.pop())
                    }
                    stack.push(c[1])
                    break
            }
        }

        while (stack.length != 0) {
            seq_out.push(stack.pop())
        }

        return seq_out
    }

    function getCellNames(seq) {
        var cellNames = []
        for (var i = 0; i < seq.length; i++) {
            var c = seq[i]
            if (sheet[c] && (cellNames.indexOf(c) == -1)) {
                cellNames.push(c)
            }
        }
        return cellNames
    }

    $('#add').click(function () {
        var prevTableLength = inputs.length
        var numRows = parseInt($('input.brd-input').val());
        var rows = document.querySelector("table").rows.length;

        for (var i = 0; i < numRows; i++) {
            var row = document.querySelector("table").insertRow(-1);
            for (var j = 0; j < 15; j++) {
                var letter = String.fromCharCode("A".charCodeAt(0) + j - 1);
                var r_i = rows + i;
                row.insertCell(-1).innerHTML = j ? "<input id='" + letter + r_i + "'+ class = 'view'/>" : rows + i;
                if (j){inputs.push(document.querySelector("#" + letter + r_i))}
            }
        }

        for (var k = prevTableLength; k < inputs.length; k++) {
            mainApp(inputs[k])
        }

    })

})

window.document.onkeydown = function () {
    if (window.modeApp == 'view') {
        startRefocus();
    }
}

function startRefocus(event) {
    event = event || window.event;
    //if (!event.ctrlKey) return;
    var key = event.keyCode;
    var targetElement = event.target || event.srcElement;
    focusMe(targetElement, key);
}

function focusMe(input, key) {
    var needFocusElement = true;

    function detectColumn(td) {
        var result = 0, x;
        while (td = td.previousElementSibling) {
            ++result
        }
        return result;
    }

    try {
        switch (key) {
            case 37:
                needFocusElement = input.parentNode.previousElementSibling.querySelector("input");
                break;
            case 39:
                needFocusElement = input.parentNode.nextElementSibling.querySelector("input");
                break;
            case 38:
                needFocusElement = input.parentNode.parentNode.previousElementSibling.querySelectorAll("td")[detectColumn(input.parentNode)].querySelector("input");
                break;
            case 40:
                needFocusElement = input.parentNode.parentNode.nextElementSibling.querySelectorAll("td")[detectColumn(input.parentNode)].querySelector("input");
                break;
            default:
                needFocusElement = false;
        }
    } catch (e) {
        needFocusElement = false;
    }

    if (!needFocusElement) return;
    needFocusElement.focus();
}
