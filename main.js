window.modeApp = 'view';

window.addEventListener("load", function () {
    var row, letter
    for (var i = 0; i < 10; i++) {
        row = document.querySelector("table").insertRow(-1);
        for (var j = 0; j < 16; j++) {
            letter = String.fromCharCode("A".charCodeAt(0) + j - 1);
            row.insertCell(-1).innerHTML = i && j ? "<input id = '" + letter + i + "' class = 'view'/>" : i || ((letter != "@") ? letter : '');
        }
    }

    var inputs = [].slice.call(document.querySelectorAll("td > input")) // массив инпутов в €чейках
    var sheet = {}  // объект содержащий состо€ние таблицы (формулы, формат)

    for (var k = 0; k < inputs.length; k++) {
        mainApp(inputs[k])
    }

    function mainApp(elm) {
        var obj = {}
        obj.format = {
            fontWeight: "normal",
            fontStyle: "normal"
        }
        obj.formula = ""
        obj.rState = $R.state([''])
        obj.rFunction = $R(function () {  // реактивна€ функци€, котора€ возвращает значение в €чейке
            var seq_out = arguments[0]
            var stack = []
            var isFormula = (seq_out.length > 1)
            var cells = getCellNames(seq_out) // массив зависимостей (€чеек)
            var operators = {'^': 1, '%': 2, '*': 3, '/': 3, '+': 4, '-': 4, '(': 5, ')': 5}
            //в цикле вычисл€етс€ по стеку, сформированному парсером формулы (обратна€ польска€ запись)
            for (var i = isFormula + 0; i < seq_out.length; i++) {
                var c = seq_out[i]
                if (operators[c]) {
                    var t = stack.pop()
                    if (c == '^') {
                        stack[stack.length - 1] = Math.pow(stack[stack.length - 1], t)
                    }
                    else if (c == '*') {
                        if (stack.length == 0) {
                            return ['err: *']
                        }
                        else {
                            stack[stack.length - 1] *= t
                        }
                    }
                    else if (c == '/') {
                        if (stack.length == 0) {
                            return ['err: /']
                        }
                        else {
                            stack[stack.length - 1] /= t
                        }
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
                else if (isFormula && sheet[c]) {
                    stack.push(arguments[cells.indexOf(c) + 1])
                }
                else {
                    stack.push(c)
                }
            }

            return stack[0]
        })
        obj.rFunction.bindTo(obj.rState)
        sheet[elm.id] = obj
        $R.dom(elm).bindAttributeTo("value", obj.rFunction);
        //$('table').find(elm)

        $(elm).on("change", function () {// устанавливаютс€ новые зависимости между €чейками и запускаетс€ процесс вычислени€
            var seqOut, cellNames
            this.value = this.value.replace(/\s+$/, '')
            sheet[this.id].formula = this.value
            if (this.value[0] == '=') {
                seqOut = parser(this.value)
                cellNames = getCellNames(seqOut)
                if (cellNames.indexOf(this.id) != -1) {
                    alert("Self-reference!")
                    return
                }
            }
            else {
                seqOut = [this.value]
                cellNames = []
            }
            var toBind = [sheet[this.id].rState]
            for (var i = 0; i < cellNames.length; i++) {
                toBind.push(sheet[cellNames[i]].rFunction)
            }
            sheet[this.id].rFunction.bindTo.apply(sheet[this.id].rFunction, toBind)
            sheet[this.id].rState.set(seqOut)
        })
        elm.readOnly = true
        elm.onfocus = function (e) {
            window.lastElement = e.target
        }
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
            }
        }
    }

//функци€ преобразовует формулу в обратную польскую запись, используетс€ алгоритм сортировочной станции
    function parser(formula) {
        var operators = {'^': 1, '%': 2, '*': 3, '/': 3, '+': 4, '-': 4, '(': 5, ')': 5}

        var seq_in = []  //

        var dig = ''    // number in formula
        var varb = ''   // variable in formula
        var dot = false //for decimal point

        for (var i = 1; i < formula.length; i++) {
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

            else if (c.match(/[A-Z]/g)) {
                if (dig.length != 0) {
                    return ['err: ' + dig + c]
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
                    return ['err: ' + dig + c]
                }
            }

            else {
                return ['err: ' + c]
            }
        }

        if (dig.length != 0) {
            seq_in.push(['n', dig])
        }
        else if (varb.length != 0) {
            seq_in.push(['n', varb])
        }

        var stack = []
        var seq_out = ['=']

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
                    if (stack.indexOf('(') == -1) {
                        return ['err: (']
                    }
                    else {
                        while (stack[stack.length - 1] != '(') {
                            seq_out.push(stack.pop())
                        }
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
            c = stack.pop()
            if (c == '(') {
                return ['err: )']
            }
            else {
                seq_out.push(c)
            }
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

//  button-events

    $('#add').click(function () {
        var prevTableLength = inputs.length
        var numRows = parseInt($('input.brd-input').val());
        var rows = document.querySelector("table").rows.length;

        for (var i = 0; i < numRows; i++) {
            var row = document.querySelector("table").insertRow(-1);
            for (var j = 0; j < 16; j++) {
                var letter = String.fromCharCode("A".charCodeAt(0) + j - 1);
                var r_i = rows + i;
                row.insertCell(-1).innerHTML = j ? "<input id='" + letter + r_i + "'+ class = 'view'/>" : rows + i;
                if (j) {
                    inputs.push(document.querySelector("#" + letter + r_i))
                }
            }
        }

        for (var k = prevTableLength; k < inputs.length; k++) {
            mainApp(inputs[k])
        }

    })
    $('#export').click(function () {
        var maxRow = 0
        var maxCol = 0
        var row, col
        for (var k = 0; k < inputs.length; k++) {
            if (sheet[inputs[k].id].formula != '') {
                col = /\D+/.exec(inputs[k].id)[0].charCodeAt() - 65
                row = parseInt(/\d+/.exec(inputs[k].id)[0]) - 1
                if (col > maxCol) {
                    maxCol = col
                }
                if (row > maxRow) {
                    maxRow = row
                }

            }
        }
        var data = new Array(maxRow + 1)
        var id
        for (var i = 0; i < maxRow + 1; i++) {
            var dataRow = new Array(maxCol + 1)
            for (k = 0; k < maxCol + 1; k++) {
                id = String.fromCharCode(k + 65) + (i + 1)
                if (sheet[id].formula == '') {
                    dataRow[k] = ''
                }
                else {
                    dataRow[k] = sheet[id].rFunction()
                }
            }
            console.log(dataRow)
            data[i] = dataRow
        }
        var csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(function (infoArray, index) {

            dataString = "'" + infoArray.join("','") + "'";
            csvContent += index < data.length ? dataString + '\n' : dataString;

        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "export.csv");
        link.click();

    })
    var elId = 'A1'
    $('#bold').click(function () {
        if (window.lastElement) {
            elId = window.lastElement.id
        }
        if (sheet[elId].format.fontWeight == "normal") {
            $("#" + elId).css("font-weight", "bold")
            sheet[elId].format.fontWeight = "bold"
        }
        else {
            $("#" + elId).css("font-weight", "normal")
            sheet[elId].format.fontWeight = "normal"
        }
    })

    $('#italic').click(function () {
        if (window.lastElement) {
            elId = window.lastElement.id
        }

        if (sheet[elId].format.fontStyle == "normal") {
            $("#" + elId).css("font-style", "italic")
            sheet[elId].format.fontStyle = "italic"
        }
        else {
            $("#" + elId).css("font-style", "normal")
            sheet[elId].format.fontStyle = "normal"
        }
    })


})

// обработка переключени€ между €чейками с помощью клавиатуры
window.document.onkeydown = function (event) {
    if (window.modeApp == 'view') {
        startRefocus(event);
    }
}

function startRefocus(event) {

    event = event || window.event;

    //if (!event.ctrlKey) return;
    var key = event.keyCode || event.which;

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

$(function () {
    $(window).scroll(function () {
        var top = $(document).scrollTop();
        if (top < 10) {
            $("#header").css({top: '0', position: 'relative'});
        }
        else {
            $("#header").css({top: '10px', position: 'fixed'})
        }

    });
});

