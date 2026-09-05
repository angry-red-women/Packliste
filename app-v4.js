function renderCategorized(){
  const t=trip();
  $('#tripSelect').innerHTML=state.trips.length?state.trips.map(x=>`<option value="${x.id}" ${x.id===state.active?'selected':''}>${x.name||'Reise'} · ${days(x)} Tage</option>`).join(''):'<option>Keine Reise</option>';
  $('#empty').classList.toggle('hidden',!!t);$('#lists').classList.toggle('hidden',!t);$('#customCard').classList.toggle('hidden',!t);$('#progressCard').classList.toggle('hidden',!t);$('#tripChooser').classList.toggle('hidden',!state.trips.length);
  if(!t)return;
  $('#tripSubtitle').textContent=`${t.name} · ${days(t)} Tage`;
  const A=baseItems(t),keys=allKeys(t),done=keys.filter(k=>t.checked?.[k]).length,pct=keys.length?Math.round(done/keys.length*100):0;
  $('#progressText').textContent=pct+' %';$('#progressBar').style.width=pct+'%';
  const root=$('#lists');root.innerHTML='';
  owners.forEach(([owner,title])=>{
    if(owner==='dog'&&!t.withYuna)return;
    const items=A[owner],sec=document.createElement('section'),grouped=Object.groupBy?Object.groupBy(items,x=>x.cat):items.reduce((a,x)=>((a[x.cat]??=[]).push(x),a),{});
    sec.className='section';sec.innerHTML=`<div class="sectionHead"><h2>${title}</h2><span class="count">${items.filter(x=>t.checked?.[x.key]).length}/${items.length}</span></div><div class="items"></div>`;
    const body=sec.querySelector('.items');
    Object.entries(grouped).forEach(([cat,arr])=>{
      const heading=document.createElement('div');heading.className='categoryTitle';heading.textContent=cat;body.appendChild(heading);
      arr.forEach(x=>{
        const custom=x.tag==='catalog'||x.tag==='legacy',row=document.createElement('div');row.className='item '+(t.checked?.[x.key]?'checked':'');
        row.innerHTML=`<input type="checkbox" ${t.checked?.[x.key]?'checked':''}><span class="label"></span>${x.qty!==1?`<span class="qty">${x.qty}${x.name==='Nassfutter'||x.name==='BARF'?' g':' ×'}</span>`:''}${custom?`<span class="itemActions">${x.tag==='legacy'?'<button class="organizeX" title="Einsortieren">Einsortieren</button>':''}<button class="deleteX" title="Löschen">×</button></span>`:''}`;
        row.querySelector('.label').textContent=x.name;
        if(x.tag&&!custom){const tag=document.createElement('span');tag.className='tag';tag.textContent=x.tag;row.querySelector('.label').append(' ',tag)}
        row.querySelector('input').onchange=e=>{t.checked??={};t.checked[x.key]=e.target.checked;save();renderCategorized()};
        if(x.tag==='legacy')row.querySelector('.organizeX').onclick=()=>openOrganize(t,x);
        if(custom)row.querySelector('.deleteX').onclick=()=>deleteCustom(t,x);
        body.appendChild(row);
      });
    });
    sec.querySelector('.sectionHead').onclick=()=>body.classList.toggle('hidden');root.appendChild(sec);
  });
}
render=renderCategorized;
function deleteCustom(t,x){
  if(x.tag==='catalog'){
    if(!confirm(`„${x.name}“ aus allen Reisen entfernen?`))return;
    state.customCatalog=catalog().filter(y=>y.id!==x.customId);state.trips.forEach(y=>{if(y.checked)delete y.checked[x.key]});
  }else{t.custom.splice(x.legacyIndex,1);if(t.checked)delete t.checked[x.key]}
  save();render();
}
function openOrganize(t,x){
  $('#organizeForm').dataset.trip=t.id;$('#organizeForm').dataset.index=x.legacyIndex;$('#organizeText').textContent=x.name;$('#organizeOwner').value=x.key.split('|')[0];fillCategories($('#organizeOwner'),$('#organizeCategory'));$('#organizeForm').classList.remove('hidden');$('#organizeForm').scrollIntoView({behavior:'smooth',block:'center'});
}
$('#customOwner').onchange=()=>fillCategories($('#customOwner'),$('#customCategory'));
$('#organizeOwner').onchange=()=>fillCategories($('#organizeOwner'),$('#organizeCategory'));
fillCategories($('#customOwner'),$('#customCategory'));
$('#addCustom').onclick=()=>{
  const text=$('#customText').value.trim(),owner=$('#customOwner').value,cat=$('#customCategory').value;
  if(!trip()||!text)return;
  if(catalog().some(x=>x.owner===owner&&x.text.trim().toLocaleLowerCase()===text.toLocaleLowerCase())){alert('Dieser Punkt ist bereits vorhanden.');return}
  state.customCatalog=catalog();state.customCatalog.push({id:uid(),key:owner+'|'+text,owner,cat,text});$('#customText').value='';save();render();
};
$('#cancelOrganize').onclick=()=>$('#organizeForm').classList.add('hidden');
$('#saveOrganize').onclick=()=>{
  const source=state.trips.find(x=>x.id===$('#organizeForm').dataset.trip),index=Number($('#organizeForm').dataset.index),legacy=source?.custom?.[index];if(!legacy)return;
  const owner=$('#organizeOwner').value,cat=$('#organizeCategory').value,text=legacy.text,oldKey=legacy.owner+'|'+text,newKey=owner+'|'+text;
  state.customCatalog=catalog();const existing=state.customCatalog.find(x=>x.owner===owner&&x.text.trim().toLocaleLowerCase()===text.trim().toLocaleLowerCase());if(existing)existing.cat=cat;else state.customCatalog.push({id:uid(),key:newKey,owner,cat,text,qty:legacy.qty||1});
  state.trips.forEach(t=>{if(t.checked?.[oldKey]&&oldKey!==newKey){t.checked[newKey]=true;delete t.checked[oldKey]}t.custom=(t.custom||[]).filter(x=>!(x.owner===legacy.owner&&x.text.trim().toLocaleLowerCase()===text.trim().toLocaleLowerCase()))});
  $('#organizeForm').classList.add('hidden');save();render();
};
$('#customText').onkeydown=e=>{if(e.key==='Enter')$('#addCustom').click()};
render();
