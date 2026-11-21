CertiFlow: Skilling Certificate Issuance
Platform - Hackathon Problem Statement
Build the system that decides who gets certified, issues the certificate, and lets anyone
check that a certificate is genuine.
Before you start
You are not expected to finish. Get as far as you can, and make what you build solid.
How you think and how well your work holds up matter more to us than how much you
finish.
Depth beats breadth. A small part that truly works beats a large app that falls over.
AI tools are allowed. You must understand and be able to explain every line you
submit.
The story
The Pragati Skills Mission (a fictional state programme) trains around 8,000 young people
a month through more than 300 private training centres. Today, centres email
spreadsheets of passed candidates to district offices, officers approve them over
WhatsApp, and a clerk types each certificate into Word and emails it out by hand. A batch
takes weeks to reach its candidates, nobody can say who approved what, and edited
copies of certificates are circulating that employers have no way to check.
The programme office wants one platform that gets certificates to candidates' phones in
days, keeps every decision on record, and lets anyone check a certificate in seconds.
The brief from the programme office
"Training centres should be able to upload their passed batches and send them for
approval. District officers check them, and big batches need extra scrutiny. The state
office has the final say. Once a batch is approved, every candidate should get their
certificate on WhatsApp straight away. Officers sometimes make mistakes, so they
should be able to fix them. Employers keep sending us fake certificates, so we need a
way for anyone to check that one is genuine. And files sitting with an officer for days
is our biggest complaint."
CertiFlow: Skilling Certificate Issuance Platform - Hackathon Problem Statement
Page 1 of 5
That is everything the programme office has told us. Turning it into clear requirements is
the first part of your job.
Who uses it
Training centres have finished a batch and want their candidates certified quickly.
District officers check batches from centres in their area. There are several officers
in each district.
A quality team takes a closer look at large batches.
The state office makes the final decision and deals with anything that goes wrong.
Candidates want their certificate on their phone.
Employers and the public want to know whether a certificate in front of them is real.
They will never log in.
What people must be able to do
A training centre can create a batch, add its candidates from the spreadsheet it
already keeps, send the batch for approval, see where it has got to, and fix and resend
it when asked.
Officers can see what is waiting for them, review a batch, and approve it, reject it or
send it back with a reason. A district decision needs more than one officer to agree.
The state office can give the final approval, see what is stuck, and cancel a certificate
that should never have been issued.
Candidates receive their certificate on WhatsApp and can download it.
Anyone can check whether a certificate is genuine, without logging in.
Everyone sees changes as they happen, without refreshing the page.
Moments that must work
1. A centre uploads a spreadsheet with a few bad rows. They find out exactly what is
wrong, and nothing half-saved ends up in the system.
2. Two district officers approve the same batch at the same moment. The batch moves
forward once, not twice.
3. A batch of 60 candidates is approved. Every candidate ends up with exactly one
certificate on their phone, even though WhatsApp is unreliable.
CertiFlow: Skilling Certificate Issuance Platform - Hackathon Problem Statement
Page 2 of 5
4. The state office cancels a fake certificate. An employer checking it a minute later is
told it is no longer valid.
5. A batch sits untouched with an officer for too long. Someone senior finds out without
anyone having to chase it.
6. An officer sends a batch back, and the centre fixes and resends it. What happens to
the approvals it already had is a deliberate, documented decision.
Things that must never happen
Someone acting at a step that is not theirs, or acting as someone else.
A candidate getting two certificates, or two certificates sharing a number.
A cancelled certificate showing as genuine.
A stranger getting hold of someone else's certificate or personal details.
A decision that cannot be traced to who made it and when.
Demo setup
Reviewers can switch between these people and try every flow straight away with sample
data: Anika (training centre), Dev, Meera and Kabir (district officers), Neha (quality
team) and Farah (state office).
Technical expectations
All of the following are mandatory.
Event-driven: parts of the system are loosely coupled through events, and slow or
unreliable work never holds up the person using it.
Scalable: the system grows by adding capacity, and stays correct when any instance
restarts at any moment.
Containerised: the whole system runs in containers and starts locally with a single
command.
Tested: automated tests prove the moments that must work and the things that must
never happen.
Secure: only the right people can do and see the right things, and tampered requests
or bad input cannot fool the system.
Observable: what happened to any batch or certificate can be traced end to end.
CertiFlow: Skilling Certificate Issuance Platform - Hackathon Problem Statement
Page 3 of 5
Tech stack
Frontend: React with Vite
Backend: Node.js with Express and TypeScript
Database: PostgreSQL, with Prisma or Drizzle and proper migrations
Caching: Redis
Background jobs and events: a queue or message broker of your choice, explained in
your README
There is no real WhatsApp account for this project. The system is expected to work
against a stand-in provider that behaves like the real one, including failing and timing out.
Where and how you use each piece is up to you. Adding a tool just to tick a box does not
count: we will ask you why it is there. You do not need to deploy to a public URL, but your
project must run locally from a fresh clone, and you must plan its deployment (see below).
Running it locally
A teammate can go from a fresh clone to a running system with demo data, and run the
tests, by following your setup guide alone.
Deployment plan
Deployment is not required. Submit a DEPLOYMENT.md with a production plan for this load:
100,000 registered users, around 10,000 daily active users
Peak (results day): around 500 batches approved in one hour, meaning about 30,000
PDFs to generate and 30,000 WhatsApp messages to deliver
Public verification: thousands of lookups a day, arriving in bursts
The plan must cover:
An architecture diagram: services, data stores and how events flow between them
Where each component is hosted, and why
Scaling: what scales horizontally, what limits throughput at peak, and how the backlog
is cleared
Failure handling: a worker crash, a Redis restart, a WhatsApp outage and a slow
database
Certificate file storage and access control
CertiFlow: Skilling Certificate Issuance Platform - Hackathon Problem Statement
Page 4 of 5
Monitoring and alerting
Rough monthly cost, and the trade-offs behind it
How we evaluate
We do not score by feature count. We look at:
Problem understanding: your requirements note, and the decisions you made where
the brief was unclear
Correctness: the moments above work, and the things that must never happen never
do
Code quality: structure, naming, readability, meaningful commits and a useful
README
Working demo: what you show actually runs
Architecture and tech choices: how the pieces fit together, what happens when one
of them fails, and how you would run it at scale
Tests: whether your tests prove the moments and rules above, and whether they pass
AI usage: where you used AI, and how you checked its output
Self-awareness: honest known bugs, limitations and next steps
What to submit by 2:30 pm
Submit through the form: https://forms.gle/rWx1qemA5RGPSMq89
1. A public GitHub repository containing everything needed to run your project,
including its Dockerfiles, Docker Compose file and automated tests.
2. A README with your requirements note at the top, followed by how the system is put
together and your key technical decisions, with reasons.
3. A local setup guide in the repository (in the README or a separate SETUP.md) that
gets a teammate from a fresh clone to a running system with demo data and passing
tests.
4. A deployment plan in the repository (DEPLOYMENT.md), as described above.
5. A demo video of 2 minutes or less (Google Drive set to "Anyone with the link", or
Loom), showing your strongest working flows.
The 2:30 pm deadline is final. There are no extensions.
CertiFlow: Skilling Certificate Issuance Platform - Hackathon Problem Statement
Page 5 of 5