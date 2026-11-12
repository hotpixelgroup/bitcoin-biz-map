import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export async function notifyReceipt(issue,state,{queueUrl=process.env.SUBMISSION_QUEUE_URL,secret=process.env.SUBMISSION_QUEUE_SECRET,deploymentUrl,deployedAt,fetcher=fetch}={}){
 const id=issue.body?.match(/<!-- anonymous-submission:([a-f0-9]{64}) -->/)?.[1];
 if(!id)return;
 if(!queueUrl||!secret)throw Error('Receipt status credentials are missing.');
 const url=new URL(queueUrl);if(url.protocol!=='https:'||url.pathname!=='/api/queue')throw Error('Invalid queue endpoint.');
 const response=await fetcher(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({id,issueNumber:issue.number,state,deploymentUrl,deployedAt})});
 if(!response.ok)throw Error(`Receipt status update failed (${response.status}).`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),issue=event.issue;
 if(!issue||issue.pull_request||!issue.body?.includes('<!-- anonymous-submission:'))process.exit(0);
 const headers={Authorization:`Bearer ${process.env.GH_TOKEN}`,Accept:'application/vnd.github+json'};
 const response=await fetch(`https://api.github.com/repos/hotpixelgroup/bitcoin-biz-map/collaborators/${encodeURIComponent(event.sender?.login||'')}/permission`,{headers,redirect:'error'});
 if(!response.ok)throw Error('Could not verify receipt editor.');
 const {permission}=await response.json();
 if(event.sender?.type!=='User'||!['admin','maintain','write'].includes(permission))process.exit(0);
 const current=await fetch(`https://api.github.com/repos/hotpixelgroup/bitcoin-biz-map/issues/${issue.number}`,{headers,redirect:'error'});
 if(!current.ok)throw Error('Could not read current review state.');
 const latest=await current.json(),labels=latest.labels.map(label=>label.name);
 // Published requires the deployment callback, not merely a label.
 if(labels.includes('published'))process.exit(0);
 await notifyReceipt(latest,latest.state==='closed'?'not-added':labels.includes('approval-blocked')?'delayed':'awaiting-review');
}
