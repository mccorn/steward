import { useEffect, useState } from "react";
import ShopListItem, { ShopListItemData } from "./ShopListItem";
import "./ShopListPage.css"

const data: ShopListItemData[] = [
  { label: "123" },
  { label: "456" },
];

function ShopListPage() {
  const [data, setData] = useState<ShopListItemData[]>([])

  useEffect(() => {
    const promise = fetch("/api/shop-list")
    promise.then(res => res.json()).then(data => setData(data.list))
  }, [])

  return (
    <div className="ShopListPage">
      {data?.map((node, idx) => <ShopListItem data={node} key={node.id || idx} />)}
    </div>
  )
}

export default ShopListPage
