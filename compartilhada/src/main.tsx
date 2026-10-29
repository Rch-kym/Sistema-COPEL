import {useEffect,useState,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
const Central=lazy(()=>import('./Central'));
import {supabase} from './api';
import './style.css';
function App(){
 const [user,setUser]=useState<any>(null),[loading,setLoading]=useState(true),[mode,setMode]=useState('login'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{supabase.auth.getSession().then(({data,error})=>{if(error)setError('Não foi possível recuperar sua sessão. Entre novamente.');setUser(data.session?.user);setLoading(false)}).catch(()=>{setError('Não foi possível conectar. Confira sua conexão.');setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user);setLoading(false)});return()=>data.subscription.unsubscribe()},[]);
 async function submit(e:any){e.preventDefault();setBusy(true);setError('');setMessage('');const f=new FormData(e.currentTarget);const email=String(f.get('email')).trim().toLowerCase(),password=String(f.get('password'));try{
 const r=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}}):await supabase.auth.signInWithPassword({email,password});
 if(r.error){const m=r.error.message;throw Error(/invalid login/i.test(m)?'E-mail ou senha incorretos.':/email not confirmed/i.test(m)?'Confirme seu e-mail antes de entrar.':/rate limit/i.test(m)?'Muitas tentativas. Aguarde alguns minutos e tente novamente.':m)}
 if(mode==='signup')setMessage('Confira sua caixa de entrada e confirme o e-mail. Depois, volte aqui para entrar. O acesso aos dados depende da liberação do administrador.');
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 if(new URLSearchParams(location.search).get('demo')==='1')return <Central demoOnly/>;
 if(loading)return <div className="auth-page"><p role="status">Abrindo a Central…</p></div>;
 if(user)return <Central key={user.id}/>;
 return <main className="auth-page"><section className="card auth-card"><img src="./copel.png" alt="COPEL — NRS Extremo Sul"/><div className="eyebrow">CENTRAL COMPARTILHADA</div><h1>{mode==='signup'?'Criar seu acesso':'Entrar na Central'}</h1><p>Processos, assinaturas e entregas da equipe.</p><form onSubmit={submit}><label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required autoFocus/></label><label className="field"><span>Senha</span><input name="password" type="password" minLength={8} autoComplete={mode==='signup'?'new-password':'current-password'} required/></label>{mode==='signup'&&<p className="fine">Use pelo menos 8 caracteres. Confirme o e-mail para concluir seu cadastro.</p>}{error&&<p className="error" role="alert">{error}</p>}{message&&<p className="auth-success" role="status">{message}</p>}<button className="btn primary" disabled={busy}>{busy?'Aguarde…':mode==='signup'?'Criar conta':'Entrar'}</button></form><button className="text-btn auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}}>{mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta. Entrar'}</button><p className="fine">Somente contas liberadas podem consultar os dados. Alterações são exclusivas do administrador.</p></section></main>;
}
createRoot(document.getElementById('root')!).render(<Suspense fallback={<div className="auth-page"><p role="status">Abrindo a Central…</p></div>}><App/></Suspense>);
