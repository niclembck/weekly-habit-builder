import React, { useEffect, useState } from 'react'

export function useToasts(){
  const [items, setItems] = useState<{id:number,msg:string}[]>([])
  function push(msg: string){
    const id = Date.now() + Math.random()
    setItems(list => [...list, {id, msg}])
    setTimeout(()=> setItems(list => list.filter(x=>x.id!==id)), 2500)
  }
  return { items, push }
}

export default function ToastStack({ items }:{ items:{id:number,msg:string}[] }){
  return <div className="toast-stack">
    {items.map(t=> <div key={t.id} className="toast">{t.msg}</div>)}
  </div>
}
