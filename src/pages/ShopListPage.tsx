import { useCallback, useEffect, useRef, useState } from "react";
import ShopListItem, { ShopListItemData } from "./ShopListItem";
import "./ShopListPage.css"

const data: ShopListItemData[] = [
  { label: "123" },
  { label: "456" },
];

function ShopListPage() {
  const [data, setData] = useState<ShopListItemData[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const promise = fetch("/api/shop-list")
    promise.then(res => res.json()).then(data => setData(data.list))
  }, [])

  const handleRemove = useCallback((label: string) => {
    const promise = fetch("/api/shop-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        payload: label
      })
    })

    promise.then(res => res.json()).then(data => setData(data.list))
  }, [])

  const handleCreate = useCallback(() => {
    const value = (inputRef.current?.value || "").trim();
    if (!value) return;

    const promise = fetch("/api/shop-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        payload: inputRef.current?.value
      })
    })

    if (inputRef.current) inputRef.current.value = "";

    promise.then(res => res.json()).then(data => setData(data.list))
  }, [])

  return (
    <>
      <div className="ShopListPage">
        {data?.map((node, idx) => <ShopListItem data={node} key={node.id || idx} onRemove={handleRemove} />)}
      </div>

      <div className="ShopListPage-Footer">
        <input ref={inputRef}></input>
        <div className="button" onClick={handleCreate} style={{ width: 50, height: 40 }}>➕️</div>
      </div>

    </>
  )
}

export default ShopListPage
