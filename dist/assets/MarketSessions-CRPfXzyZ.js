import{s as o}from"./index-CH4fzXjl.js";const p=[{id:"sydney",name:"Sydney",start:22,end:7,color:"#3b82f6"},{id:"tokyo",name:"Tokyo",start:0,end:9,color:"#ef4444"},{id:"london",name:"London",start:8,end:17,color:"#f59e0b"},{id:"new-york",name:"New York",start:13,end:22,color:"#10b981"}];function m(d){const i=()=>{var c;const r=o.get("ui.marketSessionsCollapsed")||!1,l=new Date,t=l.getUTCHours(),f=l.getUTCMinutes(),u=p.filter(e=>e.start<e.end?t>=e.start&&t<e.end:t>=e.start||t<e.end);d.innerHTML=`
      <div class="market-sessions-widget ${r?"collapsed":""}">
        <div class="sidebar-section-title" id="sessions-toggle" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none;">
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <span class="collapse-icon" style="transition:transform var(--transition-base); transform: ${r?"rotate(-90deg)":"rotate(0)"};">▼</span>
            Current Markets
          </div>
          <span class="badge badge-neutral" style="font-size:9px;">UTC ${t.toString().padStart(2,"0")}:${f.toString().padStart(2,"0")}</span>
        </div>
        <div class="sessions-list-wrapper" style="overflow:hidden; transition: max-height var(--transition-base), opacity var(--transition-base); max-height: ${r?"0":"500px"}; opacity: ${r?"0":"1"};">
          <div class="sessions-list" style="padding:0 var(--space-3);display:flex;flex-direction:column;gap:var(--space-2);padding-bottom:var(--space-4);">
            ${p.map(e=>{const s=u.includes(e);let n;if(s){let a=e.end-t;a<=0&&(a+=24),n=`Closes in ${a}h`}else{let a=e.start-t;a<=0&&(a+=24),n=`Opens in ${a}h`}return`
                <div class="session-item ${s?"active":""}" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-md);border-left:3px solid ${s?e.color:"transparent"};">
                  <div class="session-status" style="width:8px;height:8px;border-radius:50%;background:${s?e.color:"var(--text-muted)"}; box-shadow: ${s?`0 0 8px ${e.color}`:"none"};"></div>
                  <div style="flex:1;">
                    <div style="font-size:var(--text-xs);font-weight:var(--font-bold);color:${s?"var(--text-primary)":"var(--text-tertiary)"};">${e.name}</div>
                    <div style="font-size:10px;color:var(--text-tertiary);">${n}</div>
                  </div>
                  ${s?'<span class="badge badge-profit" style="font-size:8px;padding:1px 4px;">ACTIVE</span>':""}
                </div>
              `}).join("")}
          </div>
        </div>
      </div>
    `,(c=d.querySelector("#sessions-toggle"))==null||c.addEventListener("click",()=>{const e=o.get("ui.marketSessionsCollapsed")||!1;o.set("ui.marketSessionsCollapsed",!e),i()})};i();const v=setInterval(i,6e4);return()=>clearInterval(v)}export{m as renderMarketSessions};
