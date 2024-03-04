import axios from "axios";


const countVisitors = () => {
  function updateCounter(type: string) {
    axios.get("http://localhost:4000/api?" + type);
  }

  if (sessionStorage.getItem('visit') === null) {
    updateCounter('type=visit-pageview');
  } else {
    updateCounter('type=pageview');
  }

  sessionStorage.setItem('visit', "x");
}


export default countVisitors;
