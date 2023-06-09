import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    //console.log('new Product', thisProduct);
  }
  renderInMenu() {
    const thisProduct = this;
    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /* crate element using utils.crateElementFromHtml */
    /* !!!!!!!!!!!!!!!!!!!!!!!!! Element DOM zapisany od razu jako właściwość instancji
       !!!!!!!!!!!!!!!!!!!!!!!!! dzieki czemu jest do niego dostep w innych metodach instancji */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    const thisProduct = this;
    thisProduct.dom = {};
  
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }
  initAccordion(){
    const thisProduct = this;
    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
      /* prevent default action for event */
      event.preventDefault();
      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      //console.log('activeProduct: ', activeProduct);
      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if(activeProduct !== null && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });

  }
  initOrderForm(){
    const thisProduct = this;
    //console.log('Metoda: initOrderForm');
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.prepareCartProduct();
      thisProduct.backToDefault();
    });
  }
  processOrder() {
    const thisProduct = this;
  
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    // set price to default price
    let price = thisProduct.data.price;
  
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
  
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // check if it is checked
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        if(formData[paramId] && formData[paramId].includes(optionId)){
          //console.log('Jest zaznaczony');
          // check if it not dwfault option
          if(optionImage){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          if(!option.default){
            //console.log('Ten nie jest domyslny', option.price);
            price += option.price;
          }
        // check if if no checked
        } else {
          //console.log('Nie jest zaznaczony');
          if(optionImage){
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
          // check if it is default
          if(option.default){
            //console.log('Ten jest domyslny', option.price);
            price -= option.price;
          }
        }
      }
    }
    thisProduct.priceSingle = price;
    //Multiply price by amount
    price *= thisProduct.amountWidget.value;
    // update calculated price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }
  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }
  addToCart(){
    const thisProduct = this;
    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });
    thisProduct.element.dispatchEvent(event);
  }
  prepareCartProduct(){
    const thisProduct = this;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };
    //console.log(productSummary);
    return productSummary;
  }
  prepareCartProductParams(){
    const thisProduct = this;
    const cartProductParams = {};
    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    
    // for every category (param)...
    for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      cartProductParams[paramId] = {
        label: param.label,
        options: {}
      };
      
      // for every option in this category
      for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        // check if it is checked
        if(formData[paramId] && formData[paramId].includes(optionId)){
          //checked parameter
          cartProductParams[paramId].options[optionId] = option.label;
          //console.log(cartProductParams);
        }
      }
    }
    return cartProductParams;
  }
  backToDefault() {
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      for(let optionId in param.options) {
        const option = param.options[optionId];
        if(formData[paramId] && formData[paramId].includes(optionId)){
          if(!option.default){
            console.log(paramId, optionId,' checked, not default, must be unchecked');
            //const elem = thisProduct.form.querySelector('#' + optionId);
            //elem.checked = false;  <== działa dla checkboxów
          }
        } else {
          if(option.default){
            console.log(paramId, optionId,'Not checked, default, must be checked');
            //const elem = thisProduct.form.querySelector('#' + optionId);
            //elem.setAttribute('checked', '');
            //elem.checked = true;  <== działa dla checkboxów
          }
        }
      }
    }
  }
}

export default Product;
