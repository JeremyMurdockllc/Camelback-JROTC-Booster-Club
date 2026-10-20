(function () {
  var STORAGE = "camelback-booster-simple-v1";
  var OFFICES = [
    { id: "president", title: "President" },
    { id: "vp", title: "Vice President" },
    { id: "secretary", title: "Secretary" },
    { id: "treasurer", title: "Treasurer (bank account opener)" },
    { id: "agent", title: "Statutory agent (Arizona street address)" },
    { id: "sponsor", title: "School sponsor — advisor only, not an officer" }
  ];
  var currentDoc = "pxu";

  function esc(v) {
    return String(v || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function personCard(id, title, data) {
    data = data || {};
    var html = '<div class="person" data-id="' + id + '"><h3>' + title + "</h3><div class=\"grid\">";
    html += '<div><label>Full legal name</label><input data-f="name" value="' + esc(data.name) + '" /></div>';
    html += '<div><label>Position / title</label><input data-f="title" value="' + esc(data.title || title) + '" /></div>';
    html += '<div><label>Mailing address</label><input data-f="address" value="' + esc(data.address) + '" /></div>';
    html += '<div><label>Phone</label><input data-f="phone" value="' + esc(data.phone) + '" /></div>';
    html += '<div><label>Email</label><input data-f="email" value="' + esc(data.email) + '" /></div>';
    html += '<div><label>Notes (director? signer?)</label><input data-f="notes" value="' + esc(data.notes) + '" /></div>';
    html += "</div>";
    if (String(id).indexOf("member-") === 0) {
      html += '<div class="actions"><button type="button" class="ghost btn-remove">Remove</button></div>';
    }
    html += "</div>";
    return html;
  }
  function collectPeople() {
    var people = {};
    document.querySelectorAll("#peopleMount .person").forEach(function (card) {
      var row = {};
      card.querySelectorAll("[data-f]").forEach(function (inp) {
        row[inp.getAttribute("data-f")] = inp.value.trim();
      });
      people[card.getAttribute("data-id")] = row;
    });
    return people;
  }
  function collectAll() {
    return {
      clubName: val("clubName"), program: val("program"), schoolName: val("schoolName"),
      district: val("district"), schoolAddr: val("schoolAddr"), schoolPhone: val("schoolPhone"),
      adName: val("adName"), adContact: val("adContact"), mailAddr: val("mailAddr"),
      bizAddr: val("bizAddr"), fyEnd: val("fyEnd"), ein: val("ein"), bankName: val("bankName"),
 meetingDate: val("meetingDate"), mission: val("mission"),
 appType: val("appType"), orgType: val("orgType"),
 maxDonations: val("maxDonations"), activities: val("activities"),
 people: collectPeople()
    };
  }
  function blankish(s) {
    return !String(s || "").replace(/_/g, "").trim();
  }
  function nm(id) {
    var p = collectAll().people || {};
    return (p[id] && p[id].name) ? p[id].name : "______________________________";
  }
  function addr(id) {
    var p = collectAll().people || {};
    return (p[id] && p[id].address) ? p[id].address : "______________________________";
  }
  function renderPeople(people) {
    people = people || {};
    var mount = document.getElementById("peopleMount");
    var html = "";
    OFFICES.forEach(function (o) { html += personCard(o.id, o.title, people[o.id]); });
    Object.keys(people).forEach(function (id) {
      if (id.indexOf("member-") === 0) html += personCard(id, "Additional member / director", people[id]);
    });
    mount.innerHTML = html;
    mount.querySelectorAll(".btn-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".person").remove();
        persist();
        refresh();
      });
    });
  }
  function persist() {
    localStorage.setItem(STORAGE, JSON.stringify(collectAll()));
    var msg = document.getElementById("saveMsg");
    msg.textContent = "Saved " + new Date().toLocaleString() + ".";
    msg.className = "ok";
  }
  function load() {
    var raw = localStorage.getItem(STORAGE);
    var data = raw ? JSON.parse(raw) : {};
    ["clubName","program","schoolName","district","schoolAddr","schoolPhone","adName","adContact","mailAddr","bizAddr","fyEnd","ein","bankName","meetingDate","mission","appType","orgType","maxDonations","activities"].forEach(function (id) {
      if (data[id] && document.getElementById(id)) document.getElementById(id).value = data[id];
    });
    renderPeople(data.people || {});
    refresh();
  }
  function missingList() {
    var d = collectAll();
    var miss = [];
    if (!d.clubName) miss.push("Booster club legal name");
    if (!d.program) miss.push("Program (JROTC, sport, band, etc.)");
    if (!d.mailAddr) miss.push("Club mailing address (PXU will not receive booster mail at the school)");
    if (!d.bizAddr) miss.push("Arizona street address for ACC");
    if (blankish(nm("president"))) miss.push("President name");
    if (blankish(nm("treasurer"))) miss.push("Treasurer name (needed for the bank)");
    if (blankish(nm("secretary"))) miss.push("Secretary name (certifies the banking resolution)");
    if (blankish(addr("treasurer"))) miss.push("Treasurer mailing address");
    if (!d.ein) miss.push("EIN — get this from IRS.gov after C011 is approved, then paste it before the bank visit");
    if (!d.meetingDate) miss.push("Board meeting date for the banking resolution");
    if (blankish(nm("agent"))) miss.push("Statutory agent name and Arizona street address (ACC articles)");
    miss.push("SSN of EIN responsible party — enter only on IRS.gov, never in these files");
    miss.push("Principal’s current name for the PXU application (confirm at the school)");
    miss.push("ACC entity ID after C011 is approved, if the bank asks");
    miss.push("Photo ID of Treasurer and President for the bank");
    return miss;
  }
  function showMissing() {
    var items = missingList().map(function (x) { return "<li>" + x + "</li>"; }).join("");
    document.getElementById("missingBox").innerHTML = "<strong>Still needed (or confirm before filing / the bank):</strong><ul>" + items + "</ul>";
  }
  function rosterText() {
    var d = collectAll();
    var lines = [
      "BOOSTER CLUB ROSTER",
      "Club: " + (d.clubName || "[LEGAL NAME]"),
      "Program: " + (d.program || "[program]"),
      "School: " + d.schoolName + " — " + d.schoolAddr,
      "District: " + d.district,
      "School phone: " + d.schoolPhone,
      "School contact: " + d.adName + " — " + d.adContact,
      "Club mailing address: " + (d.mailAddr || "[mailing address]"),
      "Arizona business address: " + (d.bizAddr || "[AZ street address]"),
      "EIN: " + (d.ein || "[pending]"),
      "Fiscal year end: " + d.fyEnd,
      "",
      "NAME\tPOSITION\tADDRESS\tPHONE\tEMAIL\tNOTES"
    ];
    var people = d.people || {};
    Object.keys(people).forEach(function (id) {
      var p = people[id];
      if (!p.name && !p.address && !p.email) return;
      lines.push([p.name || "", p.title || id, p.address || "", p.phone || "", p.email || "", p.notes || ""].join("\t"));
    });
    return lines.join("\n");
  }
  function bylawsText() {
    var d = collectAll();
    var club = d.clubName || "[LEGAL NAME]";
    var program = d.program || "[program]";
    var mail = d.mailAddr || "[mailing address]";
    var mission = d.mission || ("support students in the " + program + " program at " + d.schoolName + " by raising funds and volunteer support, in cooperation with school administration, for activities, equipment, and educational experiences");
    return [
      "CONSTITUTION AND BYLAWS OF " + club.toUpperCase(),
      "Written to satisfy Phoenix Union High School District Operating Procedure KJA-OP-1 (Formation and Operation of Booster Clubs) and IRS 501(c)(3) organizing rules.",
      "Draft for board vote. Not filed with the Arizona Corporation Commission.",
      "",
      "========== CONSTITUTION ==========",
      "",
      "Article I — Name and independence",
      "1. The name of the booster club is " + club + " (the Organization).",
      "2. Mailing address: " + mail + ". The school shall not receive booster mail.",
      "3. The Organization supports the " + program + " program at " + d.schoolName + ", " + d.district + " (" + d.schoolAddr + ").",
      "4. The Organization is independent of the District. It assists and supports, but does not supplant, the school program. The Superintendent and principal retain control of the educational program. The Organization shall not use “Phoenix Union,” “PUHSD,” or the school name in its title or bank accounts except as the principal has approved in writing. Use of the Spartan mascot in the title requires principal permission.",
      "",
      "Article II — Purpose",
      "1. The Organization is organized exclusively for charitable and educational purposes under Internal Revenue Code section 501(c)(3), including " + mission + ".",
      "2. All funds shall be used for the tax-exempt public purpose of the Organization and donated to a school program, student activity, or student organization in accordance with PUHSD policy, except for ordinary operating costs of the Organization (bank fees, permitted event costs the principal has approved).",
      "3. No part of the net earnings shall inure to members, officers, directors, or other private persons except reasonable compensation for services rendered.",
      "4. The Organization shall not participate in any political campaign on behalf of or in opposition to any candidate for public office, and shall not place political advertising on District property.",
      "",
      "Article III — Membership",
      "1. Qualifications: A parent or legal guardian identified in the PUHSD student information system, a community member, or other person who supports the purpose may enroll by registering name, address, telephone, and email with the Secretary.",
      "2. Membership is without regard to race, ethnicity, religion, gender, or disability.",
      "3. Dues: The Executive Board may set optional annual dues. Dues-paying status shall not be linked to expenditures on behalf of any student. The Organization shall not exist to support only the children of participating parents.",
      "4. Only enrolled members may vote or hold office. Members must be enrolled at least 30 days before an officer election to vote in that election.",
      "5. Employees of PUHSD shall not be officers or check signers. They may serve as ex officio, non-voting advisors (the certified staff sponsor).",
      "",
      "Article IV — Officers (Executive Board)",
      "1. Officers, who together compose the Executive Board, are President, Vice President, Secretary, and Treasurer. One person may serve as Vice President and Secretary if members are willing.",
      "2. Term: one year, beginning at the close of the meeting at which elected. The same office may be held no more than two consecutive years, plus one additional year if no other candidate will run.",
      "3. Duties:",
      "   President — preside at meetings; liaison to the principal; submit the annual PXU Booster Club Application; obtain prior written principal approval for fundraising and facility use; maintain a spend-approval channel so at least three board members approve disbursements; sign contracts and checks with board approval.",
      "   Vice President — act as President when the President is absent; vote on expenditures; recruit volunteers.",
      "   Secretary — minutes of all meetings (permanent records); membership roll; custodian of constitution, bylaws, articles, EIN, IRS letter, and District approvals; turn records over within 30 days of election.",
      "   Treasurer — receive, record, and deposit all funds in an account solely in the Organization’s name; two signatures on every check; pay only against invoices or original receipts; reconcile each bank statement within 30 days (a second officer who does not handle money reviews and signs); year-end financial report to the principal by August 31; IRS 990 series after exemption.",
      "4. Current officers: President " + nm("president") + "; Vice President " + nm("vp") + "; Secretary " + nm("secretary") + "; Treasurer " + nm("treasurer") + ".",
      "",
      "Article V — Amending this Constitution",
      "1. Who may propose: (a) the Executive Board by two-thirds vote of officers then in office, or (b) a written petition signed by at least sixty-six percent (66%) of enrolled members.",
      "2. Notice: at least fourteen days’ written or electronic notice to members stating the text of the proposed amendment and the time and place of the vote.",
      "3. Method: secret ballot of members present at a general or special meeting called for that purpose (uncontested technical corrections may be by voice vote).",
      "4. Adoption: two-thirds of members present and voting, provided a quorum of the Executive Board is present. Amendments must remain consistent with KJA-OP-1, Arizona law, and section 501(c)(3).",
      "",
      "Article VI — Adoption and ratification",
      "1. This Constitution is adopted by majority vote of members present at the organizational meeting and is ratified by the signatures of the officers below.",
      "2. Later amendments are adopted only as provided in Article V.",
      "3. A two-thirds vote of the Executive Board is required to recommend an amendment to the membership.",
      "",
      "========== BYLAWS ==========",
      "",
      "Bylaw I — Powers of the Executive Board",
      "The Executive Board transacts business between general meetings; creates committees; approves committee plans; prepares and approves an annual budget; reviews financial records; and reports to the membership. The certified staff sponsor counsels the board and does not vote on expenditures or sign checks. The Organization shall not supervise District employees, set team rules, or decide which trips a student organization will take. The principal makes those decisions.",
      "",
      "Bylaw II — Committees",
      "The President, with Executive Board consent, may create standing or special committees (for example: fundraising, hospitality, communications). Committee membership is volunteer members appointed for the business year. Each chair reports at year end and inventories Organization property.",
      "",
      "Bylaw III — Succession",
      "If the presidency is vacant, the Vice President becomes President. Other vacancies are filled by majority vote of the remaining Executive Board for the unexpired term. Officers may be removed for good cause by majority of members present at a meeting called for that purpose with at least 14 days’ notice.",
      "",
      "Bylaw IV — Elections and qualifications",
      "1. Officers are elected annually by secret ballot at the final general membership meeting of the business year (or another meeting the Executive Board schedules). Uncontested offices may be filled by voice vote.",
      "2. A candidate must be an enrolled member, not a PUHSD employee, and willing to undergo any background check the District requires for campus volunteers.",
      "3. A member must appear in person to vote unless the Executive Board has adopted a written absentee method consistent with these bylaws.",
      "",
      "Bylaw V — Financial procedures",
      "1. Fiscal year: August 1 through " + d.fyEnd + " of the following calendar year, unless the board adopts a different year consistent with IRS filings. Year-end financial report is due to the principal by August 31.",
      "2. Internal controls: two signatures on every check; no blank checks; cash counted by two members; deposits prompt; no commingling with personal, student-club, or District funds; no District or school EIN; no school letterhead.",
      "3. Authorization before commitment: disbursements require prior approval of at least three Executive Board members (or a minuted board vote). The Organization shall not maintain a petty-cash or miscellaneous fund for the discretionary use of a coach or sponsor.",
      "4. No individual student accounts. No crediting fundraising to a particular student.",
      "5. Student travel: the Organization donates to the school. Representatives shall not sign hotel, bus, or airfare contracts for student travel. Students pay required participation fees to the campus bookstore.",
      "6. Bank reconciliation within 30 days; independent third-party review of the books annually (need not be a CPA). Financial records kept five years.",
      "7. Arizona Attorney General Opinions I84-018 / I84-032: the Organization shall not hold a raffle on PUHSD property or using PUHSD resources. If students or cadets work a fundraiser, net proceeds shall be split between the Organization and the school’s JROTC student activity account (campus bookstore / District activity account), in percentages written on the principal-approved fundraiser form. Parent-only fundraisers may remain 100% Organization funds. No cash to individual students.",
      "",
      "Bylaw VI — Meetings",
      "1. Regular: at least two general membership meetings each business year — one in August or September and one in May — at a time and place accessible to members and the public, with principal facility approval if on campus.",
      "2. Special: may be called by the President or any two officers with at least two weeks’ notice of date, time, place, and purpose.",
      "3. Quorum to transact business: a majority of the Executive Board, not counting ex officio advisors.",
      "4. Who conducts: the President, or the Vice President in the President’s absence. Action is by a seconded motion and majority vote of those entitled to vote who are present, except where this Constitution requires a higher vote.",
      "",
      "Bylaw VII — District operating rules incorporated",
      "The Organization shall comply with KJA-OP-1, including: annual re-application; principal approval before fundraising or facility use; no awards given directly to individual students (donate to the school instead); no employing, contracting, or supplementing District staff; no requiring students to fundraise a quota; gifts to coaches only with prior written principal approval.",
      "",
      "Bylaw VIII — Dissolution",
      "The Executive Board shall adopt a resolution that the question of dissolution will be submitted to a vote at a special meeting of members. At least 30 days before that meeting, each member entitled to vote shall receive written or printed notice that the purpose is to consider dissolution. Remaining assets shall be distributed for 501(c)(3) purposes or to government for a public purpose, preferably remaining with the " + program + " program at " + d.schoolName + ". Assets shall not be distributed to members.",
      "",
      "Bylaw IX — Amendment of bylaws",
      "These bylaws may be amended by majority vote of members present and voting at a meeting called for that purpose, with fourteen days’ notice, provided the amendment is consistent with the Constitution, KJA-OP-1, and section 501(c)(3).",
      "",
      "Adopted this ____ day of ______________, 20____.",
      "President: " + nm("president") + "    Signature: ______________________________",
      "Vice President: " + nm("vp") + "    Signature: ______________________________",
      "Secretary: " + nm("secretary") + "    Signature: ______________________________",
      "Treasurer: " + nm("treasurer") + "    Signature: ______________________________"
    ].join("\n");
  }
  function planText() {
    var d = collectAll();
    var club = d.clubName || "[LEGAL NAME]";
    var program = d.program || "[program]";
    var mission = d.mission || ("Support students in the " + program + " program at " + d.schoolName + " through fundraising and volunteer help, in cooperation with school administration.");
    return [
      "BUSINESS PLAN",
      club.toUpperCase(),
      "A parent booster supporting " + program + " at " + d.schoolName,
      d.district,
      "Draft — not a PXU or IRS form. Confirm with the principal before fundraising.",
      "",
      "1. Executive summary",
      club + " is a volunteer parent organization. It will incorporate as an Arizona nonprofit corporation, obtain its own EIN, and seek IRS 501(c)(3) recognition so donations can be tax-deductible. It will not operate until the principal and Phoenix Union have approved the annual booster application (KJA / KJA-OP-1). Nobody owns a nonprofit; the Executive Board is accountable to members, donors, and students.",
      "",
      "2. Need",
      d.schoolName + " (" + d.schoolAddr + ") runs the " + program + " program under District control. Public-school activity budgets often do not cover extras (travel, equipment beyond District issue, awards dinners the principal approves). A booster raises those extras without using the school’s EIN or putting District employees in charge of the money.",
      "",
      "3. Mission",
      mission,
      "",
      "4. Legal structure (year 1)",
      "• Arizona nonprofit corporation — stock Form C011, then C015 amendment with IRS language. Not an LLC.",
      "• EIN from IRS.gov after incorporation. Never use the PUHSD EIN.",
      "• Two-signature bank account in the corporate name. Banking resolution designates Treasurer " + nm("treasurer") + " to open the account; President " + nm("president") + " and Treasurer are signers.",
      "• Form 1023-EZ ($275) after the articles amendment is approved, if eligible (projected receipts usually $50,000 or less).",
      "• Phoenix / Maricopa: no newspaper publication; ACC database posting is enough.",
      "",
      "5. Governance",
      "Officers (PUHSD employees cannot serve):",
      "  President — " + nm("president"),
      "  Vice President — " + nm("vp"),
      "  Secretary — " + nm("secretary"),
      "  Treasurer — " + nm("treasurer"),
      "School sponsor (advisor only) — " + nm("sponsor"),
      "Campus contact — " + d.adName + " (" + d.adContact + ")",
      "Mailing address — " + (d.mailAddr || "[not the school mailroom]"),
      "Meetings: at least August/September and May, open to members and the public.",
      "",
      "6. Year-1 activities (all need prior written principal approval)",
      "• Fan support at " + program + " events.",
      "• Parent-run fundraisers (concessions only if principal-approved and food-code compliant). Parents plan fundraisers; students are not required to sell a quota.",
      "• Donations to the school for competitive fees, District-approved uniforms/equipment, and student travel (club donates; school contracts).",
      "• Optional awards dinner hosted as a nonprofit event the principal has approved.",
      "• No raffles on PUHSD property (AG Opinion I84-018). No individual student accounts. No paying coaches or hiring staff.",
      "",
      "7. Year-1 budget skeleton (fill dollar amounts after the first board meeting)",
      "Income: dues $____; fundraiser 1 $____; fundraiser 2 $____; donations $____; total $____.",
      "Expenses: program donations to school $____; approved event costs $____; bank/insurance/state fees $____; reserve for next fall $____; total $____.",
      "PXU application asks for anticipated maximum fiscal-year cash donations; list that figure on the District form. Equipment donations always need Governing Board approval. Cash above the application cap needs extra Board approval.",
      "Fiscal year ends " + d.fyEnd + ". EIN: " + (d.ein || "[pending]") + ".",
      "",
      "8. Compliance calendar",
      "Before any event — principal written approval / fundraiser form.",
      "Monthly — bank reconciliation within 30 days.",
      "Each meeting — treasurer report and minutes.",
      "By August 31 — PXU annual application + year-end financials to the principal.",
      "ACC anniversary — Arizona corporation annual report.",
      "15th day of 5th month after fiscal year end — IRS 990-N / 990-EZ.",
      "",
      "9. Risks",
      "Operating before District approval; using school name or EIN; employees as signers; individual student accounts; raffles; signing travel contracts; missing 990-N for three years (automatic revocation); missing ACC annual report (administrative dissolution).",
      "",
      "10. Sources used for this plan",
      "PXU KJA-OP-1 Formation and Operation of Booster Clubs; PXU booster document library https://www.pxu.org/documents/departments/bookstore/booster-club/639148",
      "Camelback athletics https://www.pxu.org/o/chs/page/athletics",
      "Parent Booster USA start-a-club steps (incorporate, EIN, 501(c)(3), state registration) https://parentbooster.org/start-a-booster-club",
      "Cullinane Law — make a plan, recruit a board, nobody owns a nonprofit https://cullinanelaw.com/how-to-start-a-booster-club/",
      "Arizona Business Center https://arizonabusinesscenter.azcc.gov/",
      "",
      "Prepared for board review. Update dollar amounts after the first budget vote."
    ].join("\n");
  }
  function amendText() {
    var d = collectAll();
    var club = d.clubName || "[LEGAL NAME]";
    var program = d.program || "[program]";
    return [
      "AMENDMENT TO THE ARTICLES OF INCORPORATION OF " + club.toUpperCase(),
      "An Arizona Nonprofit Corporation",
      "",
      "Pursuant to A.R.S. §10-11001 et seq., the Board of Directors of " + club + ", an Arizona nonprofit corporation, duly adopted the following amendment to the Articles of Incorporation on [DATE]. If the Corporation has members entitled to vote on amendments, the members also approved this amendment on [DATE] pursuant to A.R.S. §10-11003. If the Corporation has no members entitled to vote, member approval is not required (A.R.S. §10-11002).",
      "",
      "The Articles of Incorporation are hereby amended to add the following new articles. These articles are added to include the language required by the Internal Revenue Service for recognition of tax-exempt status under Section 501(c)(3) of the Internal Revenue Code of 1986, as amended.",
      "",
      "ARTICLE ___: PURPOSE",
      "The Corporation is organized exclusively for charitable, religious, educational, and scientific purposes, including, for such purposes, the making of distributions to organizations that qualify as exempt organizations under Section 501(c)(3) of the Internal Revenue Code of 1986, as amended, or the corresponding section of any future federal tax code.",
      "",
      "More specifically, and without limitation, the Corporation is organized to support student programs in " + program + " at " + d.schoolName + ", " + d.district + ", by raising funds and volunteer support for educational activities, equipment, and student experiences, in cooperation with school administration.",
      "",
      "ARTICLE ___: TAX-EXEMPT STATUS PROVISIONS",
      "Section 1. Private Inurement Prohibition. No part of the net earnings of the Corporation shall inure to the benefit of, or be distributable to its members, directors, officers, or other private persons, except that the Corporation shall be authorized and empowered to pay reasonable compensation for services rendered and to make payments and distributions in furtherance of the purposes set forth herein.",
      "",
      "Section 2. Legislative and Political Activity Prohibition. No substantial part of the activities of the Corporation shall be the carrying on of propaganda, or otherwise attempting to influence legislation, and the Corporation shall not participate in, or intervene in (including the publishing or distribution of statements) any political campaign on behalf of or in opposition to any candidate for public office.",
      "",
      "Section 3. General Limitations. Notwithstanding any other provision of these Articles, the Corporation shall not carry on any other activities not permitted to be carried on (a) by a corporation exempt from federal income tax under Section 501(c)(3) of the Internal Revenue Code, or the corresponding section of any future federal tax code, or (b) by a corporation, contributions to which are deductible under Section 170(c)(2) of the Internal Revenue Code, or the corresponding section of any future federal tax code.",
      "",
      "ARTICLE ___: DISSOLUTION",
      "Upon the dissolution of the Corporation, after paying or making provision for the payment of all of the liabilities of the Corporation, assets shall be distributed for one or more exempt purposes within the meaning of Section 501(c)(3) of the Internal Revenue Code, or the corresponding section of any future federal tax code, or shall be distributed to the federal government, or to a state or local government, for a public purpose. Any such assets not so disposed of shall be disposed of by a Court of Competent Jurisdiction of the county in which the principal office of the Corporation is then located, exclusively for such purposes or to such organization or organizations, as said Court shall determine, which are organized and operated exclusively for such purposes.",
      "",
      "Note: Fill ARTICLE numbers to match the original C011 articles (next unused numbers if these clauses are new).",
      "",
      "The foregoing amendment was duly adopted by the Board of Directors of " + club + " on [DATE], in accordance with A.R.S. §10-11001 et seq.",
      "",
      "President: " + nm("president"),
      "Signature: ______________________________",
      "Date: __________"
    ].join("\n");
  }
  function bankText() {
    var d = collectAll();
    var club = d.clubName || "[LEGAL NAME]";
    var bank = d.bankName || "a federally insured bank or credit union of the Treasurer’s choosing";
    var when = d.meetingDate || "[BOARD MEETING DATE]";
    var ein = d.ein || "[EIN — add after IRS issues it]";
    return [
      "CORPORATE BANKING RESOLUTION",
      club.toUpperCase(),
      "An Arizona Nonprofit Corporation",
      "",
      "Supporting: " + d.schoolName + " (" + d.district + ")",
      "School address: " + d.schoolAddr,
      "School contact: " + d.adName + " — " + d.adContact,
      "Club mailing address: " + (d.mailAddr || "[mailing address]"),
      "Known place of business: " + (d.bizAddr || "[AZ street address]"),
      "EIN: " + ein,
      "",
      "At a meeting of the Board of Directors of " + club + " held on " + when + ", the following resolution was adopted:",
      "",
      "RESOLVED, that the Treasurer is authorized and directed to open and maintain one or more checking and/or savings accounts in the legal name of the Corporation with " + bank + ";",
      "",
      "FURTHER RESOLVED, that the Corporation’s Employer Identification Number (" + ein + ") shall be used on all accounts, and the District’s or school’s taxpayer identification number shall not be used;",
      "",
      "FURTHER RESOLVED, that the account title shall be the Corporation’s legal name and shall not include “Phoenix Union,” “PUHSD,” or the school name except as the principal has approved in writing;",
      "",
      "FURTHER RESOLVED, that the following officers are authorized signers, and that two signatures are required on every check, withdrawal, or electronic payment:",
      "  President: " + nm("president") + "    Address: " + addr("president"),
      "  Treasurer: " + nm("treasurer") + "    Address: " + addr("treasurer"),
      "",
      "FURTHER RESOLVED, that the Treasurer, " + nm("treasurer") + ", is the officer designated to present this resolution, the Articles of Incorporation, the EIN confirmation, and photo identification to the bank to open the account;",
      "",
      "FURTHER RESOLVED, that employees of Phoenix Union High School District shall not be signers on the account;",
      "",
      "FURTHER RESOLVED, that this resolution remains in effect until a later resolution delivered to the bank replaces it.",
      "",
      "Officer roster at adoption:",
      "  President — " + nm("president"),
      "  Vice President — " + nm("vp"),
      "  Secretary — " + nm("secretary"),
      "  Treasurer — " + nm("treasurer"),
      "",
      "Certification",
      "I, " + nm("secretary") + ", Secretary of " + club + ", certify that the foregoing is a true copy of a resolution adopted by the Board of Directors on " + when + ", and that it is in full force.",
      "",
      "Secretary signature: ______________________________    Date: __________",
      "President signature: ______________________________    Date: __________",
      "Treasurer signature: ______________________________    Date: __________"
    ].join("\n");
  }
  function off(id, field) {
    var p = collectAll().people || {};
    return (p[id] && p[id][field]) ? p[id][field] : "";
  }
  function dash(s) {
    return s || "____________________";
  }
  function pxuAppHtml() {
    var d = collectAll();
    var club = dash(d.clubName);
    var isNew = d.appType !== "Renewal or Updated Application";
    var formal = d.orgType !== "Informal Non-Profit Association";
    function row(id, office) {
      return "<tr><td>" + office + "</td><td>" + dash(off(id, "name")) + "</td><td>" + dash(off(id, "address")) + "</td><td>" + dash(off(id, "phone")) + "</td><td>" + dash(off(id, "email")) + "</td></tr>";
    }
    return [
      "<div class='meta'><span>KJA-OP-1 EB</span><span>PHOENIX UNION HIGH SCHOOL DISTRICT NO. 210</span></div>",
      "<h1>Booster Club / Other School Support Organization Application</h1>",
      "<p>Issued 8/23/11 &nbsp;|&nbsp; Filled from the Camelback booster kit. Sign in ink. Submit two copies to the principal.</p>",
      "<p><strong>[" + (isNew ? "X" : " ") + "] New Application &nbsp;&nbsp; [" + (isNew ? " " : "X") + "] Renewal or Updated Application</strong></p>",
      "<p><strong>Name of Organization:</strong> " + club + "</p>",
      "<p><strong>Taxpayer Identification #:</strong> " + dash(d.ein) + "</p>",
      "<p><strong>Related Student Organization(s) or Club(s):</strong> " + dash(d.program) + " at " + dash(d.schoolName) + "</p>",
      "<p><strong>The objectives/purposes of the organization are:</strong><br>" + dash(d.mission) + "</p>",
      "<p><strong>Officers:</strong> (identify additional officers on a separate page)</p>",
      "<table><thead><tr><th>Office</th><th>Name</th><th>Address</th><th>Phone Number</th><th>E-mail address</th></tr></thead><tbody>",
      row("president", "President"),
      row("vp", "Vice-President"),
      row("secretary", "Secretary"),
      row("treasurer", "Treasurer"),
      "</tbody></table>",
      "<p>We, the parents/members of the above-named organization, have read the Guidelines for Parent Booster Clubs and Other School Support Organizations and agree to abide by them. Failure to comply with PUHSD policies and procedures could result in immediate termination of PUHSD recognition of organization and access to students/PUHSD facilities. We will submit two signed copies of this application and the items listed on the checklist below to the principal who will obtain approval from the District.</p>",
      "<div class='sig'><p>Signature of Parent Representative<br>" + dash(off("president", "name")) + "<br>Office held: President</p><p>Date</p><p></p></div>",
      "<p><strong>PUHSD Approval</strong></p>",
      "<div class='sig'><p>Signature of Principal<br>School: " + dash(d.schoolName) + "</p><p>Date</p><p></p></div>",
      "<p>The school retains the original application/checklist and sends copies to the District Comptroller for final approval.</p>",
      "<div class='sig'><p>Signature of Executive Director of Finance</p><p>Date</p><p></p></div>",
      "<p><strong>Type of Organization (check one)</strong><br>[" + (formal ? "X" : " ") + "] Formal Non-Profit Corporation &nbsp;&nbsp; [" + (formal ? " " : "X") + "] Informal Non-Profit Association</p>",
      "<p><strong>Attachments and information with this application</strong></p>",
      "<ul>",
      "<li>[X] Completed Application/Renewal Form</li>",
      "<li>[X] Constitution and Bylaws (print the Constitution &amp; bylaws tab)</li>",
      "<li>[" + (isNew ? " " : "X") + "] Most Recent Treasurer’s Financial Report / Income Statement from Prior Fiscal Year</li>",
      "<li>[X] List of proposed activities &amp; events for the year / budget:<br>" + dash(d.activities) + "</li>",
      "<li>[X] Anticipated maximum fiscal year donations (for Board approval) = " + dash(d.maxDonations) + "</li>",
      "<li>[ ] Copy of most recent bank statement &amp; names of those authorized to withdraw funds: " + dash(off("president", "name")) + " (President), " + dash(off("treasurer", "name")) + " (Treasurer)</li>",
      "<li>[ ] IRS determination letter / evidence of tax-exempt status — IRS Section 501(c)(3)</li>",
      "<li>[" + (formal && !isNew ? "X" : " ") + "] Arizona Corporation Commission Annual report for previous fiscal year</li>",
      "<li>[" + (formal && isNew ? "X" : " ") + "] Articles of Incorporation (if you are a new applicant to the PUHSD)</li>",
      "</ul>",
      "<p>Campus contact: " + dash(d.adName) + " — " + dash(d.adContact) + "</p>"
    ].join("");
  }
  function fundraiserText() {
    var d = collectAll();
    return [
      "REQUEST FOR APPROVAL OF ORGANIZATION FUND RAISER",
      "Phoenix Union High School District — Exhibit EC style worksheet (KJA-OP-1)",
      "Submit during planning. Principal written approval required before any fundraising.",
      "",
      "Organization: " + dash(d.clubName),
      "School: " + dash(d.schoolName),
      "Related student organization: " + dash(d.program),
      "Date of request: ____________________",
      "Proposed date(s) of activity: ____________________",
      "Location: ____________________",
      "Will this use a PUHSD facility or school name? Yes / No   Facility Rental Form attached? Yes / No",
      "",
      "Description of fundraising activity:",
      dash(d.activities),
      "",
      "Parents (not students) will plan and implement this activity.",
      "Students required to sell a quota? No.",
      "Door-to-door solicitation? Voluntary only, if any.",
      "Raffle or chance drawing? No (AG Opinion I84-018).",
      "Food sales on campus? If yes, Maricopa County food-handling rules apply.",
      "",
      "Allocation of proceeds — required if students/cadets work the event (AG Opinion I84-032):",
      "  School JROTC student activity account (campus bookstore / District account): ______%",
      "  Booster club: ______%",
      "  Total must equal 100%. Do not pay cash to individual students.",
      "  Parent-only fundraisers (no student labor) may be 100% booster.",
      "",
      "Estimated income $________   Estimated expenses $________   Estimated net $________",
      "Two members who will count money: 1) ____________________  2) ____________________",
      "Deposit to booster account (not a student or District account).",
      "",
      "Requester: " + dash(off("president", "name")) + "  Office: President  Phone: " + dash(off("president", "phone")),
      "Signature: ______________________________  Date: __________",
      "",
      "Principal approval (prior written): ______________________________  Date: __________",
      "Denied: ______________________________  Reason: ____________________"
    ].join("\n");
  }
  function recText() {
    var d = collectAll();
    return [
      "MONTHLY BANK RECONCILIATION",
      dash(d.clubName) + " — Exhibit ED style (KJA-OP-1)",
      "Month / statement date: ____________________",
      "Account name (no school or PUHSD words): " + dash(d.clubName),
      "EIN: " + dash(d.ein),
      "",
      "Bank statement ending balance                          $________",
      "Add: deposits in transit                               $________",
      "Subtract: outstanding checks                           $________",
      "Reconciled cash balance                                $________",
      "Books / check register balance                         $________",
      "Difference (must be zero)                              $________",
      "",
      "Revenue sources this month (must tie to deposits):",
      "  Source ____________________  Amount $________",
      "  Source ____________________  Amount $________",
      "  Source ____________________  Amount $________",
      "",
      "Expenditures this month (date, check #, payee, description, amount):",
      "  ____  ____  ____________________  ____________________  $________",
      "  ____  ____  ____________________  ____________________  $________",
      "  ____  ____  ____________________  ____________________  $________",
      "  ____  ____  ____________________  ____________________  $________",
      "",
      "Treasurer (prepares within 30 days of statement): " + dash(off("treasurer", "name")),
      "Signature: ______________________________  Date: __________",
      "",
      "Second officer (does not handle money; reviews outstanding items): " + dash(off("president", "name")),
      "Signature: ______________________________  Date: __________"
    ].join("\n");
  }
  function yearEndText() {
    var d = collectAll();
    return [
      "YEAR-END FINANCIAL REPORT",
      dash(d.clubName) + " — Exhibit EE style (KJA-OP-1)",
      "Due to the principal with the annual Booster Club Application by August 31.",
      "Fiscal year ending: " + dash(d.fyEnd),
      "School: " + dash(d.schoolName) + "    Program: " + dash(d.program),
      "EIN: " + dash(d.ein),
      "",
      "BEGINNING CASH                                         $________",
      "",
      "Income",
      "  Dues                                                 $________",
      "  Fundraisers                                          $________",
      "  Donations                                            $________",
      "  Other                                                $________",
      "  Total income                                         $________",
      "",
      "Expenses / donations to school programs",
      "  Competitive fees / travel donated to school          $________",
      "  Approved uniforms / equipment donated                $________",
      "  Principal-approved events                            $________",
      "  Bank / insurance / filing fees                       $________",
      "  Other                                                $________",
      "  Total expenses                                       $________",
      "",
      "ENDING CASH                                            $________",
      "Reserve carried forward for next fall                  $________",
      "",
      "Cash donations to PUHSD this year                      $________",
      "Maximum pre-approved on application                    " + dash(d.maxDonations),
      "Equipment donations (need Board approval)              $________",
      "",
      "Independent third-party review completed? Yes / No     Reviewer: ____________________",
      "",
      "Treasurer: " + dash(off("treasurer", "name")),
      "Signature: ______________________________  Date: __________",
      "President: " + dash(off("president", "name")),
      "Signature: ______________________________  Date: __________",
      "Executive Board approved: ______________________________  Date: __________"
    ].join("\n");
  }
  function rolesText() {
    var d = collectAll();
    var club = d.clubName || "Camelback High School booster (working name TBD)";
    return [
      "ROLES AND RESPONSIBILITIES",
      "Share with prospective members so they can pick an office.",
      club,
      d.schoolName + " — " + d.district,
      "PXU employees cannot be officers or check signers.",
      "",
      "CORE GOVERNANCE",
      "• Digital approval threshold: 3–4 member executive board approval on the digital platform before Coach/Admin spend requests are processed.",
      "• Annual meeting cycle: 2–3 formal meetings a year to review, accept, and archive Treasurer financial statements.",
      "• District & tax compliance: PXU District authorizations, fundraising permits, and annual IRS filings.",
      "",
      "PRESIDENT — Strategic Liaison & Infrastructure Lead",
      "Best fit: comfortable with the principal, checks email, can run a short meeting.",
      "• Approval infrastructure: email list for spend requests so every board member can vote and the 3–4 member threshold is met.",
      "• District authorization: annual application for Governing Board approval; Club Sponsor / Booster Agreement with PXU.",
      "• Digital spend approval: primary reviewer for Coach transaction requests; mission alignment before quorum voting.",
      "• Fundraising leadership: PXU fundraising request forms for every event; presides over all 2–3 annual meetings.",
      "",
      "VICE PRESIDENT — Operational Support & Digital Approver",
      "Best fit: answers messages quickly; recruits volunteers.",
      "• Digital approver: timely vote on expenditure requests so the 3–4 member minimum is met.",
      "• Presidential succession: full President duties in their absence, including the approval list and PXU fundraising requests.",
      "• Volunteer coordination: recruits helpers for fundraising events and club activities set at annual meetings.",
      "• Project support: special initiatives and large fundraisers that need administrative oversight.",
      "",
      "SECRETARY — Registrar & Documentation Officer",
      "Best fit: writes things down and keeps a folder. If it is not written down, PXU and the IRS treat it as if it did not happen.",
      "• Meeting documentation: minutes for all 2–3 annual meetings, including membership acceptance of the Treasurer’s report.",
      "• Approval verification: digital approval logs vs. minutes.",
      "• Bylaw custodian: official bylaws on file; digital spend-approval protocols documented with PXU.",
      "• Records archive: board communications, voting logs, and administrative records.",
      "",
      "TREASURER — Financial Custodian & First Sergeant Liaison",
      "Best fit: keeps receipts, never mixes club money with personal money. Not a PXU employee.",
      "• Receipt allocation: Athletic Director / First Sergeant so Coach credit-card and debit receipts are allocated correctly.",
      "• Digital audit trail: 3–4 member approvals paired with receipts for every transaction.",
      "• Financial reporting: year-to-date income/expense statements at the 2–3 annual meetings.",
      "• PXU & tax compliance: close fiscal year, Annual Report to Principal and District, IRS tax forms.",
      "",
      "SCHOOL SPONSOR (coach / instructor): advisor only. Not an officer. Not a signer."
    ].join("\n");
  }
  function agendaText() {
    var d = collectAll();
    var club = d.clubName || "Camelback High School JROTC Booster Club";
    var when = d.meetingDate || "[Meeting date]";
    var loc = d.schoolName || "Camelback High School";
    return [
      club.toUpperCase(),
      "JROTC Booster Club — Meeting Agenda",
      "Date: " + when,
      "Place: " + loc + "  (principal facility approval if on campus)",
      "Time: 5:00 p.m. – 6:10 p.m.  (adjust as needed)",
      "",
      "Format example based on a high-school JROTC booster agenda. Replace bracketed items. Officers fill from the roster on this page.",
      "",
      "1. Call meeting to order — President  (5:00–5:05)",
      "   " + nm("president"),
      "",
      "2. Welcome / introductions  (5:05–5:10)",
      "   Booster Club members:",
      "   President:       " + nm("president"),
      "   Vice President:  " + nm("vp"),
      "   Secretary:       " + nm("secretary"),
      "   Treasurer:       " + nm("treasurer"),
      "   School sponsor (advisor only, not an officer): " + nm("sponsor"),
      "",
      "3. Treasurer’s report  (5:10–5:15)",
      "   Year-to-date income vs. expenses.",
      "   Motion to accept the Treasurer’s report. Secretary records the vote.",
      "",
      "4. Board business  (5:15–5:35)",
      "   a. Board members for approval / open seats",
      "   b. Nominations (if a seat is vacant)",
      "   c. Updates",
      "      — Merchandise / current items for sale",
      "      — PXU application / corporation / EIN status",
      "   d. Requests",
      "      — Joint fundraiser with cadets: net proceeds split between the booster club",
      "        and the school JROTC student activity account (campus bookstore).",
      "        Write percentages on the Fundraiser request form. Principal written approval required.",
      "        No raffle. No cash to individual students.",
      "",
      "5. Instructors  (5:35–5:45)",
      "   Updates",
      "   Requests (advisor only — does not vote on money, does not sign checks)",
      "",
      "6. Cadets  (5:45–5:55)",
      "   Updates",
      "   Requests",
      "",
      "7. Open forum  (5:55–6:10)",
      "",
      "8. Adjourn",
      "",
      "Next meeting: ____________________",
      "Minutes to be prepared by Secretary: " + nm("secretary")
    ].join("\n");
  }
  function logoSrc() {
    try { return new URL("spartans-logo.jpg", window.location.href).href; } catch (e) { return "spartans-logo.jpg"; }
  }
  function agendaHtml() {
    var d = collectAll();
    var club = d.clubName || "Camelback High School JROTC Booster Club";
    var when = d.meetingDate || "[Meeting date]";
    var loc = d.schoolName || "Camelback High School";
    var logo = logoSrc();
    function item(n, title, time, body) {
      return "<div class='ag-item'><div class='ag-num'>" + n + "</div><div><h3>" + title + " <span>" + time + "</span></h3>" + body + "</div></div>";
    }
    return [
      "<div class='agenda-sheet'>",
      "<div class='ag-brand'>",
      "<img src='" + logo + "' alt='Camelback Spartans' />",
      "<div class='ag-titles'>",
      "<p class='ag-jrotc'>JROTC</p>",
      "<h1>" + club + "</h1>",
      "<p class='ag-sub'>Booster Club Meeting Agenda</p>",
      "<p class='ag-meta'><strong>Date:</strong> " + when + " &nbsp;|&nbsp; <strong>Place:</strong> " + loc + " &nbsp;|&nbsp; <strong>Time:</strong> 5:00–6:10 p.m.</p>",
      "</div></div>",
      "<p class='ag-note'>Principal facility approval required if on campus. Officers listed below fill from the roster. Mascot use needs principal permission.</p>",
      item("1", "Call meeting to order — President", "5:00–5:05", "<p>" + nm("president") + "</p>"),
      item("2", "Welcome / introductions", "5:05–5:10",
        "<table><tr><th>Office</th><th>Name</th></tr>" +
        "<tr><td>President</td><td>" + nm("president") + "</td></tr>" +
        "<tr><td>Vice President</td><td>" + nm("vp") + "</td></tr>" +
        "<tr><td>Secretary</td><td>" + nm("secretary") + "</td></tr>" +
        "<tr><td>Treasurer</td><td>" + nm("treasurer") + "</td></tr>" +
        "<tr><td>School sponsor (advisor only)</td><td>" + nm("sponsor") + "</td></tr></table>"),
      item("3", "Treasurer’s report", "5:10–5:15", "<p>Year-to-date income vs. expenses. Motion to accept. Secretary records the vote.</p>"),
      item("4", "Board business", "5:15–5:35",
        "<p>a. Board members for approval / open seats<br>b. Nominations (if a seat is vacant)<br>c. Updates — merchandise; PXU application / corporation / EIN<br>d. Requests — joint fundraiser with cadets: net proceeds split between the booster club and the school JROTC student activity account (campus bookstore). Write percentages on the Fundraiser request. Principal written approval required. No raffle. No cash to individual students.</p>"),
      item("5", "Instructors", "5:35–5:45", "<p>Updates. Requests. Advisor only — does not vote on money, does not sign checks.</p>"),
      item("6", "Cadets", "5:45–5:55", "<p>Updates. Requests.</p>"),
      item("7", "Open forum", "5:55–6:10", "<p></p>"),
      item("8", "Adjourn", "", "<p>Next meeting: ____________________ &nbsp; Minutes: " + nm("secretary") + "</p>"),
      "</div>"
    ].join("");
  }
  function currentText() {
    if (currentDoc === "pxu") return "See on-screen PXU application form. Use Download PDF.";
    if (currentDoc === "bylaws") return bylawsText();
    if (currentDoc === "plan") return planText();
    if (currentDoc === "amend") return amendText();
    if (currentDoc === "bank") return bankText();
    if (currentDoc === "fundraiser") return fundraiserText();
    if (currentDoc === "rec") return recText();
    if (currentDoc === "yearend") return yearEndText();
    if (currentDoc === "roles") return rolesText();
    if (currentDoc === "agenda") return agendaText();
    return rosterText();
  }
  function fileBase() {
    var slug = (val("clubName") || "camelback-booster").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return slug + "-" + currentDoc;
  }
  var ROLES_PDF = "camelback-jrotc-executive-roles-handout.pdf";
  function refresh() {
    var pre = document.getElementById("preview");
    var form = document.getElementById("formPreview");
    var pdf = document.getElementById("rolesPdf");
    if (pdf) pdf.style.display = "none";
    if (currentDoc === "pxu") {
      pre.style.display = "none";
      form.style.display = "block";
      form.innerHTML = pxuAppHtml();
    } else if (currentDoc === "agenda") {
      pre.style.display = "none";
      form.style.display = "block";
      form.innerHTML = agendaHtml();
    } else if (currentDoc === "roles") {
      pre.style.display = "none";
      form.style.display = "none";
      if (pdf) pdf.style.display = "block";
    } else {
      form.style.display = "none";
      pre.style.display = "block";
      pre.textContent = currentText();
    }
    showMissing();
  }
  function docHtml() {
    if (currentDoc === "pxu") return pxuAppHtml();
    if (currentDoc === "agenda") return agendaHtml();
    return "<pre style=\"font-family:Times New Roman,serif;font-size:12pt;white-space:pre-wrap\">" +
      currentText().replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</pre>";
  }
  function downloadPdf() {
    persist();
    refresh();
    if (currentDoc === "roles") {
      var a = document.createElement("a");
      a.href = ROLES_PDF;
      a.download = "camelback-jrotc-executive-roles-handout.pdf";
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
      return;
    }
    var w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      window.print();
      return;
    }
    w.document.write("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>" + fileBase() +
      "</title><style>body{font-family:Calibri,Segoe UI,sans-serif;font-size:12pt;margin:.6in;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #0c3c8c;padding:4px;vertical-align:top;text-align:left}.ag-brand{display:flex;gap:16px;align-items:center;border-bottom:6px solid #e85d04;padding-bottom:10px;margin-bottom:12px}.ag-brand img{height:90px}.ag-jrotc{margin:0;font-weight:800;letter-spacing:.18em;color:#e85d04;font-size:13px}.ag-titles h1{font-size:18px;color:#0c3c8c;margin:4px 0}.ag-sub{margin:0;font-weight:700;color:#0c3c8c}.ag-meta{margin:6px 0 0;font-size:12px}.ag-note{font-size:11px;color:#57534e}.ag-item{display:flex;gap:10px;margin:10px 0}.ag-num{flex:0 0 24px;height:24px;border-radius:50%;background:#0c3c8c;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}.ag-item h3{margin:0 0 4px;font-size:14px;color:#0c3c8c}.ag-item h3 span{color:#e85d04;font-weight:650;font-size:12px}.sig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-top:1rem}.sig p{border-top:1px solid #000;margin:1.2rem 0 0;padding-top:.2rem;font-size:10pt}.meta{display:flex;justify-content:space-between;font-size:10pt}@media print{body{margin:.5in}}</style></head><body>");
    w.document.write(docHtml());
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 400);
  }
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function toCsv() {
    var d = collectAll();
    var rows = [["role","name","position","address","phone","email","notes"]];
    Object.keys(d.people || {}).forEach(function (id) {
      var p = d.people[id];
      rows.push([id, p.name || "", p.title || "", p.address || "", p.phone || "", p.email || "", p.notes || ""]);
    });
    return rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\n");
  }

  document.getElementById("btnAddMember").addEventListener("click", function () {
    var data = collectAll();
    data.people = data.people || {};
    data.people["member-" + Date.now()] = { name: "", title: "Member", address: "", phone: "", email: "", notes: "" };
    renderPeople(data.people);
    persist();
    refresh();
  });
  document.getElementById("btnSave").addEventListener("click", function () { persist(); refresh(); });
  document.getElementById("btnClear").addEventListener("click", function () {
    if (confirm("Clear all saved booster data in this browser?")) {
      localStorage.removeItem(STORAGE);
      location.reload();
    }
  });
  document.querySelectorAll(".tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentDoc = btn.getAttribute("data-doc");
      document.querySelectorAll(".tabs button").forEach(function (b) { b.classList.toggle("on", b === btn); });
      refresh();
    });
  });
  document.getElementById("btnDoc").addEventListener("click", function () {
    persist();
    download(fileBase() + ".doc", "<html><head><meta charset=\"utf-8\"></head><body>" + docHtml() + "</body></html>", "application/msword");
  });
  document.getElementById("btnPdf").addEventListener("click", function () { downloadPdf(); });
  document.getElementById("btnTxt").addEventListener("click", function () {
    persist();
    download(fileBase() + ".txt", currentText(), "text/plain");
  });
  document.getElementById("btnCsv").addEventListener("click", function () {
    persist();
    download((val("clubName") || "camelback-booster").replace(/[^A-Za-z0-9]+/g, "-") + "-roster.csv", toCsv(), "text/csv");
  });
  document.getElementById("btnPrint").addEventListener("click", function () { persist(); refresh(); window.print(); });
  document.querySelector(".wrap").addEventListener("input", function () { refresh(); });
  document.querySelectorAll("[data-open]").forEach(function (a) {
    a.addEventListener("click", function () {
      var doc = a.getAttribute("data-open");
      var btn = document.querySelector('.tabs button[data-doc="' + doc + '"]');
      if (btn) btn.click();
    });
  });
  load();
})();
