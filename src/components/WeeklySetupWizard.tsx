
import React from 'react'

type Props = { open: boolean; onClose: () => void }

function Stepper({ step }: { step: number }){
  return <div className="whb-wizard-stepper">
    {[1,2,3,4].map(i => <div key={i} className={"whb-step-dot " + (i===step?'active':'')} />)}
  </div>
}

export default function WeeklySetupWizard({ open, onClose }: Props){
  const [step, setStep] = React.useState(1)
  const next = ()=> setStep(s => Math.min(4, s+1))
  const back = ()=> setStep(s => Math.max(1, s-1))
  if (!open) return null
  return (
    <div className="whb-wizard-backdrop" role="dialog" aria-modal="true">
      <div className="whb-wizard">
        <div className="whb-wizard-head">
          <div className="whb-wizard-title">
            {step===1 && 'Look back before you move forward'}
            {step===2 && 'How do you want to plan this week?'}
            {step===3 && 'Time to level up'}
            {step===4 && 'Here’s your week ahead'}
          </div>
          <Stepper step={step} />
        </div>
        <div className="whb-wizard-body">
          {step===1 && (<div className="grid gap-4">
            <div className="muted">You completed 4 of 7 days last week. Great work!</div>
            <textarea className="textarea" placeholder="What went well last week?" rows={5} />
          </div>)}
          {step===2 && (<div className="grid grid-cols-3 gap-4">
            <button className="card p-5 text-left hover:opacity-90">
              <div style={{fontWeight:600}}>🔄 Copy Last Week</div>
              <div className="muted" style={{marginTop:6, fontSize:14}}>Repeat the same plan as last time</div>
            </button>
            <button className="card p-5 text-left hover:opacity-90">
              <div style={{fontWeight:600}}>⚡ Defaults & Patterns</div>
              <div className="muted" style={{marginTop:6, fontSize:14}}>Use your Library defaults and day patterns</div>
            </button>
            <button className="card p-5 text-left hover:opacity-90">
              <div style={{fontWeight:600}}>🎯 Choose a Template</div>
              <div className="muted" style={{marginTop:6, fontSize:14}}>Pick from your saved week layouts</div>
            </button>
          </div>)}
          {step===3 && (<div className="grid gap-3">
            <div className="card p-4">
              <div style={{fontWeight:600}}>Consider variety</div>
              <div className="muted" style={{fontSize:14, marginTop:4}}>You’ve repeated some choices for a few weeks. Mix in a longer run or a different project focus.</div>
            </div>
            <div className="card p-4">
              <div style={{fontWeight:600}}>Keep what’s working</div>
              <div className="muted" style={{fontSize:14, marginTop:4}}>Your mornings are consistent Tue/Wed—great momentum.</div>
            </div>
          </div>)}
          {step===4 && (<div className="grid gap-2">
            <div className="muted">Preview (static):</div>
            <div className="card p-4">
              <div className="grid grid-cols-3 gap-2">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                  <div key={d} className="subcard">
                    <div style={{fontWeight:600}}>{d}</div>
                    <div className="muted" style={{fontSize:12, marginTop:4}}>AM: Prototype 4-track</div>
                    <div className="muted" style={{fontSize:12}}>Mid: Freelance UX</div>
                    <div className="muted" style={{fontSize:12}}>Act: Run</div>
                  </div>
                ))}
              </div>
            </div>
          </div>)}
        </div>
        <div className="whb-wizard-cta">
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
          <div style={{display:'flex', gap:8}}>
            {step>1 && <button className="btn" onClick={back}>Back</button>}
            {step<4 && <button className="btn btn-accent" onClick={next}>Next</button>}
            {step===4 && <button className="btn btn-accent" onClick={onClose}>Confirm Setup</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
