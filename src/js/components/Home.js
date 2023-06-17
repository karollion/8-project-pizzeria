import {templates, select} from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(element){
    const thisHome = this;
    thisHome.render(element);
    thisHome.initActions();
  }

  render(element){
    const thisHome = this;
    const homeHTML = templates.homePage();
    thisHome.element = utils.createDOMFromHTML(homeHTML);
    const homeContainer = document.querySelector(select.containerOf.home);
    homeContainer.appendChild(thisHome.element).innerHTML;
    
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
  }

  initActions(){
    //const thisHome = this;
  }
}
export default Home;