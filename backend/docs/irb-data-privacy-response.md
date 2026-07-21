# IRB Data & Privacy Response
## Point Taken — AI Feedback Study
**Prepared by:** Corey Zhang, Christopher Heo, Aakriti Kumar
**Last updated:** May 18, 2026

---

### What data will you collect from me?

We collect the following categories of data:

- **Account information:** First name, last name, and email address provided at registration.
- **Game session data:** Debate topic, the text of argument tiles placed during a session, tile timestamps, player role (for/against the topic), and session outcome.
- **AI evaluation metadata:** Whether AI feedback was triggered, which argument quality categories were flagged (e.g., too broad, causal leap), whether the user accepted or revised a suggestion, and the AI model name and prompt version used. The actual tile text processed by the AI is also logged server-side for research analysis.
- **Survey and stance data:** Optional pre/post survey responses and stated topic stances if collected as part of the study protocol.

We do not collect financial information, location data, device identifiers, or any sensitive personal information beyond name and email.

---

### Will you collect personally identifiable information (PII)?

Yes. Account registration requires a first name, last name, and email address. These are used for authentication and to link a participant's game sessions across the study period.

Debate argument content (tile text) is not PII by design but could incidentally contain personal information if a participant chooses to reference personal details in their arguments. Participants are not prompted to do so.

---

### Is participation anonymous, confidential, or identifiable?

Participation is **confidential but not anonymous**. Participants create accounts with their email address, so records are identifiable at the data collection level. However, all research analysis and reporting will use pseudonymized identifiers (see below), and no participant will be identified by name in any publication or report.

---

### How will my information be stored and protected?

All data is stored in **AWS DynamoDB** (us-east-2 region), a managed NoSQL database service with encryption at rest enabled by default. The application backend is hosted on **AWS Elastic Beanstalk**, also in us-east-2. All client-server communication is encrypted in transit via HTTPS/TLS. No data is stored locally on participant devices beyond session cookies.

---

### What security measures are used to protect the data? Tools used?

- **Encryption in transit:** HTTPS/TLS for all API and socket communication.
- **Encryption at rest:** AWS DynamoDB encryption at rest (AES-256, managed by AWS KMS).
- **Password security:** User passwords are hashed using **Argon2id** before storage. Plaintext passwords are never stored or logged.
- **Authentication:** Session tokens issued as **HTTP-only, Secure JWT cookies** to prevent client-side script access. AWS Cognito JWT verification is used for certain authentication flows.
- **Access control:** Backend API endpoints require a valid session token. Role-based access controls restrict admin functions to authorized accounts.
- **Infrastructure:** AWS security groups restrict inbound access to application servers. The AI service (FastAPI) is not directly publicly accessible.

---

### How long will my data be retained?

> **[To be confirmed by research team / PI]** Proposed: Research data will be retained for a minimum of [X years] following study completion in accordance with Northwestern University data retention policies. Participants may request deletion of their data at any time prior to data anonymization (see below).

---

### Who will have access to my data?

Access is limited to:

- The study research team (PI, RAs at Steve's Lab and Groh Lab)
- Corey Zhang and Christopher Heo (developers) for system maintenance and data export
- AWS infrastructure (as the cloud service provider) under their standard data processing agreement

No data will be shared with third parties outside the research team except as required by law or described in the AI processing section below.

---

### What authentication system is used?

The application uses **email and password authentication**. On login, the server issues a signed **JWT** stored as an HTTP-only, Secure cookie. The token contains the user's ID and role and is verified on every authenticated request. AWS Cognito is used as an additional verification layer for certain authentication flows.

---

### Do you use multi-factor authentication (MFA)?

**No**, multi-factor authentication is not currently implemented for participant accounts. Access to the backend infrastructure (AWS console, server administration) is protected by MFA for all developer and research team accounts.

> **[Note for IRB response]:** If MFA is a requirement, we can explore adding it for participant accounts in a future update.

---

### How is identifying information logically separated from research data?

Participant PII (name, email) is stored in a **Users** table keyed by a randomly generated `userId` (UUID). All game sessions and AI evaluation records reference only the `userId`, not the participant's name or email. Research data exports use only the `userId` as an identifier, not any PII fields.

---

### How is identifying information physically separated from research data?

All data resides within AWS DynamoDB in the same region (us-east-2). Logical separation is enforced at the table level (Users table vs. Games table). Physical separation into distinct storage systems is not currently implemented, but access to the Users table is restricted to authentication flows only. Research exports do not query the Users table.

> **[To be confirmed]:** If the IRB requires physical separation, we can implement a separate anonymized research database as part of the study setup.

---

### Are participant identifiers stored separately from study responses?

Yes, in practice. The `userId` UUID is the only identifier that appears in game and AI evaluation records. The mapping from `userId` to name/email exists only in the Users table, which is not included in research data exports. Researchers receive game records identified by `userId` only.

---

### Is anonymization or pseudonymization used?

**Pseudonymization** is used. Each participant is assigned a randomly generated UUID (`userId`) at registration. All research data is keyed to this UUID. The mapping between UUID and PII (name, email) is maintained separately and not included in research analysis datasets.

Full anonymization (permanent removal of the UUID-to-PII mapping) can be applied at the end of the data collection period if required.

---

### How is AI used in the study?

The AI system evaluates the quality of debate arguments that participants submit during gameplay. Specifically, after a participant places and confirms an argument tile, the text of that argument is sent to the AI service for analysis. The AI checks for argument quality issues (e.g., overgeneralization, false causation, personal attacks) and may suggest a revised version of the argument. Participants can accept, revise, or ignore the feedback.

AI is used as an in-game coaching tool, not for screening, scoring participants, or making any decisions about their participation in the study.

---

### What AI model or platform is used?

The application uses **Anthropic Claude** (specifically `claude-sonnet-4-5` for argument evaluation and `claude-haiku-4-5` for the AI Co-Player feature). These are accessed via the **Anthropic API**.

---

### Is the AI model internal or provided by a third party?

The AI model is provided by a **third party**, Anthropic, PBC. Anthropic is a US-based AI safety company. The model is accessed via their commercial API and is not hosted or controlled by our research team.

---

### What participant data is transferred to AI systems?

Only the **text of the debate argument tile** (the participant's typed argument, max 100 characters) is sent to the Anthropic API, along with the debate topic and the text of the parent tile being responded to. No participant names, email addresses, user IDs, or any other PII are included in API requests.

---

### Is any data sent outside the organization?

Yes. Argument tile text is sent to **Anthropic's API** (US-based servers) for processing. No other participant data leaves our AWS infrastructure.

---

### Is participant data stored by the AI provider?

Under Anthropic's standard **API usage policy**, inputs and outputs submitted via the API are not used to train Anthropic's models and are not retained beyond what is necessary to fulfill the request. Anthropic does not store API inputs/outputs after the response is returned, unless the customer has opted into data retention features (which we have not).

> **Reference:** Anthropic API data usage policy — https://www.anthropic.com/legal/privacy

---

### Is the data only processed in transit?

Yes, with respect to Anthropic's systems — argument text is processed in real time and the response is returned. Anthropic does not retain a copy.

On our side, the argument text and AI evaluation outputs (categories flagged, feedback text, model name, prompt version) are **logged to our own DynamoDB** for research analysis. This is first-party retention within our own infrastructure, not by the AI provider.

---

### Are prompts, outputs, or logs retained?

Yes, within our own systems. The AI model's output (flagged categories, feedback text, suggestion, model name, prompt version, timestamp) is stored in the Games table as part of the game record. This data is retained for research analysis and is subject to the data retention period described above.

The system prompt and prompt templates used to instruct the AI model are version-controlled in the application codebase and are not stored per-participant.

---

### Will any participant data be used for AI model training?

**No.** We do not opt in to any data sharing or model training programs with Anthropic. Participant argument data will not be used to train any AI model, either by Anthropic or by our research team.

---

### Can participants opt out of AI-based processing?

Yes. The AI feedback feature can be toggled off by the participant at any time during a session. When AI feedback is disabled, no argument text is sent to the Anthropic API. The participant can still play the game normally without AI involvement.

---

### What safeguards prevent re-identification of participants?

- Research exports use only the `userId` UUID, not name or email.
- The UUID-to-PII mapping table is not included in any research dataset.
- Debate argument content is limited to 100 characters and is not prompted to include personal information.
- Exports intended for external analysis will be reviewed for incidental PII before sharing.

---

### Will my data ever be shared beyond this study?

Anonymized or pseudonymized game data may be shared in aggregate in academic publications or presentations, consistent with IRB-approved protocols. No individually identifiable data will be shared outside the research team.

---

### How can I request deletion of my data?

Participants may contact the research team to request deletion of their account and associated game data. Deletion requests will be fulfilled within [X business days], provided the data has not already been anonymized as part of the final research dataset. Once anonymization is complete, individual records cannot be selectively deleted.

> **[Contact information to be added by PI]**

---

### Who should I contact for privacy or security concerns?

> **[To be filled in by PI / Athira]**
> - Principal Investigator: [Name, email]
> - Study contact: Corey Zhang — coreyzhang2029@u.northwestern.edu
> - Northwestern IRB: [IRB office contact]

---

*Note: Items marked [To be confirmed] require input from the PI or research team before submission.*
