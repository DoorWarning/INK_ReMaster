// client/src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 주소(pathname)나 쿼리스트링(search, ?category=...)이 바뀌면 맨 위로 스크롤
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}