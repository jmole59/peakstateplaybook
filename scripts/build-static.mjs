import {lstat,mkdir,copyFile,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
// Reviewed public files at design-refresh 879910c5f920bf46c9609ccf8328c2f86ed07ad0.
// New assets must be deliberately added here; never recursively copy the repository.
export const publicFiles=[
 'index.html','404.html','_redirects','robots.txt','sitemap.xml',
 'about-us/index.html','basketball-training/index.html','contact/index.html',
 'film-room/index.html','game-plan/index.html','login/index.html',
 'peak-state-starter/index.html','privacy/index.html','school-team-workshops/index.html','terms/index.html',
 'assets/about-court-hero.webp','assets/about-hero-final.webp','assets/about-hero-v3.webp',
 'assets/about-hero.webp','assets/about-jarrod-portrait.webp','assets/chrome.css','assets/chrome.js',
 'assets/film-hero-final.webp','assets/film-hero.webp','assets/film-review-details.webp','assets/film-review-hero.webp',
 'assets/game-plan-court-hero.webp','assets/game-plan-cover.webp','assets/game-plan-spiral-final.webp',
 'assets/gold-logo.svg','assets/gold-p-icon.svg','assets/lesson-email-logo.png','assets/home-hero-shooting-color.webp',
 'assets/home-hero-shooting.webp','assets/home-hero-v3.webp','assets/home-hero.webp',
 'assets/jarrod-sprite-final.webp','assets/launch.css','assets/launch.js','assets/lesson-signup.js','assets/prime-cover-player.webp',
 'assets/schools-classroom-hero-v2.webp','assets/schools-classroom-hero-v3.webp','assets/schools-classroom-hero-v4.webp',
 'assets/schools-classroom-hero.webp','assets/schools-hero.webp','assets/schools-workshop-hero.webp',
 'assets/partners/southern-tigers.webp','assets/partners/darwin-basketball.webp','assets/partners/cardijn-college.webp','assets/partners/mandurah-magic.webp','assets/partners/parba.webp','assets/partners/kilsyth-heat.webp',
 'assets/site.css','assets/site.js','assets/training-cinematic-hero.webp','assets/training-hero-v3.webp',
 'assets/training-hero.webp','assets/training-session.webp'
];
export async function buildStatic(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 root=resolve(root);if((await lstat(root)).isSymbolicLink())throw Error('Root symlinks are not allowed');
 const output=resolve(root,'dist');
 try{if((await lstat(output)).isSymbolicLink())throw Error('Output symlinks are not allowed');}catch(e){if(e.code!=='ENOENT')throw e;}
 // Validate every source and ancestor before cleaning an existing build.
 for(const file of publicFiles){
  const segments=file.split('/');let current=root;
  for(let i=0;i<segments.length;i++){current=resolve(current,segments[i]);const stat=await lstat(current);if(stat.isSymbolicLink()||!(i===segments.length-1?stat.isFile():stat.isDirectory()))throw Error('Invalid required public file: '+file);}
 }
 await rm(output,{recursive:true,force:true});await mkdir(output);
 for(const file of publicFiles){const target=resolve(output,file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(root,file),target);}
 return publicFiles.length;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log('Published static file count: '+await buildStatic());}catch(e){console.error('Static build failed: '+e.message);process.exitCode=1;}}
