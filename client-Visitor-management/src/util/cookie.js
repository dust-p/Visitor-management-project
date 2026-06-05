export function getCookie(name) {
    const cookieArr = document.cookie.split("; ");
    for (let i = 0; i < cookieArr.length; i++) {
      const [key, val] = cookieArr[i].split("=");
      if (key === name) return decodeURIComponent(val);
    }
    return null;
  }
  