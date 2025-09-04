import React from 'react'
const EMOJIS = ["🎯","🧠","💡","🧪","💼","🎸","📗","🏃","🧘","🏋️","🚴","🎹","📝","🧘‍♂️","🏊"]
export default function EmojiPicker({ onPick, onClose }:{ onPick:(e:string)=>void, onClose:()=>void }){
  return (
    <div className="card p-4" style={{maxHeight:200, overflow:'auto'}}>
      <div className="grid" style={{gridTemplateColumns:'repeat(8, 1fr)', gap:8}}>
        {EMOJIS.map(e => <button key={e} className="btn" onClick={()=>{ onPick(e); onClose() }}>{e}</button>)}
      </div>
    </div>
  )
}
