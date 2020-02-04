
export function validateInput(arr_keys,props){
    try{
        arr_keys.forEach((key)=>
        {
            if(!(props.hasOwnProperty(key) && props[key])){
                throw {name: "validatingInputError", message: key+" value missing"}
            }
        })

    }catch(err){
        console.log("error caught in validating input");
        console.log("error",err);
        throw err;
    }
}

function addInputFields(key,value){
  return '<input  name="' + key + '" value="' + value + '"+ type="hidden"/>'
}

//returns payment form
export function createForm(formUrl,props){
    try{
        if(typeof props !== "object"){
            throw {name:"invalidPropType", message:"props not an object"}
        }
        let inputString = "";
        Object.keys(props).forEach((key)=>{
            inputString = inputString + addInputFields(key, props[key]);
        });
        let htmlString = '<body><form id="redirectForm" method="post" action="' + formUrl + '">' + inputString + '</form><script> document.getElementById("redirectForm").submit();</script></body>';
        return htmlString;
    }
    catch(err){
        console.log("error caught in creating htmlString");
        console.log("error",err);
        throw {name:"createHtmlStringError", message:err.message}
    }
}

const paymentUrls = {
    test: "https://test.cashfree.com/billpay/checkout/post/submit",
    prod: "https://www.cashfree.com/checkout/post/submit"
}

export {paymentUrls};
