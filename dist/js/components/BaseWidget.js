class BaseWidget{
  constructor(wrapperElement, initialValue){
    const thisWidget = this;

    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;

    thisWidget.correctValue = initialValue;
  }
  /**
   * getter - The method that is executed on each 
   * attempt to read the value of "value"
   */
  get value(){
    const thisWidget = this;

    return thisWidget.correctValue;
  }
  /**
   * setter - The method that is executed on each 
   * attempt to set new value of "value"
   */
  set value(value){
    const thisWidget = this;
    //Convers to int
    const newValue = thisWidget.parseValue(value);
    /* TODO: Add Validation */
    if(thisWidget.correctValue !== newValue && thisWidget.isValid(newValue)){ // !isNaN(newValue) - negative function Not a Number 
      thisWidget.correctValue = newValue;
      thisWidget.announce();
    }
    thisWidget.renderValue();
  }

  setValue(value){
    const thisWidget = this;

    thisWidget.value = value;
  }

  parseValue(value){
    return parseInt(value);
  }

  isValid(value){
    return !isNaN(value);
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value;
  }

  announce(){
    const thisWidget = this;
    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default BaseWidget;