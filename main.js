
window.addEventListener("load",function() {
    for (var i = 0; i < 6; i++) {
        var row = document.querySelector("table").insertRow(-1);
        for (var j = 0; j < 15; j++) {
            var letter = String.fromCharCode("A".charCodeAt(0) + j - 1 );
            row.insertCell(-1).innerHTML = i && j ? "<input id = '" + letter + i + "'/>" : i || ((letter != "@")? letter : '');
        }
    }

    //!!!!!!!!!!!!!!!!!!!!!!

    var inputs = [].slice.call(document.querySelectorAll("td > input"))

    /*
     inputs.forEach(function(elm) {
     elm.onfocus = function (e) {
     e.target.value = localStorage[e.target.id] || "";
     //console.log(e.target)
     };
     elm.onblur = function (e) {
     var value = e.target.value;
     localStorage[e.target.id] = value;
     */


    //!!!!!!!!!!!!!!!!!!!

    /*           if (value.charAt(0) == "=") {
     elm.value = eval(value.substring(1));
     console.log(elm.value);
     } else {
     elm.value = isNaN(parseFloat(value)) ? value : parseFloat(value);
     }
     */            //computeAll();
//!!!
    /*
     };
     })
     */
//!!!!!!!!!!
    // var value = localStorage[elm.id] || "";
    /*
     if (value.charAt(0) == "=") {
     eval(value.substring(1));
     } else { return isNaN(parseFloat(value)) ? value : parseFloat(value);
     */
//console.log(inputs)


    var table = $('table')
    //   console.log(table)

    var sheet = {}

    for (var k = 0; k < inputs.length; k++){
        var obj = {}
            
        obj.rState = $R.state()
        obj.rFunction = $R(function(){
                return arguments[arguments.length-1]
        })

        sheet[inputs[k].id] = obj//localStorage[inputs[k].id]
        //var parsedInput = $R(parseInt).bindToInput(table.find(inputs[k]))


        $R.dom(table.find(inputs[k])).bindAttributeTo("value", obj.rFunction);

        $(inputs[k]).on("change", function(){

            if (isNaN(this.value)) {
                sheet[this.id].rFunction.bindTo(sheet[this.id].rState, sheet[this.value].rFunction)
            }
            else {
                sheet[this.id].rFunction.bindTo(sheet[this.id].rState)
            }
            sheet[this.id].rState.set(this.value)

        })

    }

    /*
     sheet["A5"].rFunction.modify(function(a){
     console.log(a)
     return a * a})
     */
    //sheet["A5"].rFunction.bindTo(sheet["A5"].parsedInput, sheet["A1"].rFunction)
    //sheet["B5"].rFunction.bindTo(sheet["B5"].parsedInput, sheet["A5"].rFunction)
    //console.log(sheet["A5"].rFunction())
    /*
     var a1 = $R.state(10);

     console.log(table.find(".A4"))
     $R.dom(table.find(".A4")).bindInputTo(a1)
     a1.set(20)
     console.log(table.find(".A4").val())
     */

    $('#add').click(function(){
        var numRows = parseInt($('input.brd-input').val());
        var rows = document.querySelector("table").rows.length;

        for (var i = 0; i < numRows; i++) {
            var row = document.querySelector("table").insertRow(-1);
            for (var j = 0; j < 15; j++) {
                var letter = String.fromCharCode("A".charCodeAt(0) + j - 1 );
                var r_i = rows + i;
                row.insertCell(-1).innerHTML = j ? "<input id='" + letter + r_i + "'/>" : rows + i;
            }
        }

    })


    window.document.onkeydown = function () {
        startRefocus();
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
})