# OASW-Quiz-site
 Quiz site for an OASW anti-Asian racism training. The host controls the flow of the quiz while participants answer questions within a time limit.  
 While multiple participants can take part in the quiz, a single instance of the host controls must be opened to start/stop the timer and advance the quiz.
 
## Host Controls
<img src="https://user-images.githubusercontent.com/93284023/191536986-60c01df7-3f4b-4a0b-ad49-0d3f5586644c.jpg" width=500 alt="Host controls"><br>
 <b>Start:</b> Pressed once at the beginning to start the quiz.<br>
 <b>Stop:</b> Stops the timer for the current question in case the host wants to end the timer prematurely.<br>
 <b>Reset:</b> Resets the entire quiz.<br>
 <b>Next:</b> Goes to the next question.<br>
 <b>Previous:</b> Goes to the previous question.<br>
 <b>Green</b> shows the correct answer while <b>red</b> shows incorrect answers.<br>

 
 
 ## Participant View
 
<img src ="https://user-images.githubusercontent.com/93284023/191541262-2829fe30-486a-43df-9019-0b7041957004.jpg" width=500 alt="Participant view while quiz is running"><img src="https://user-images.githubusercontent.com/93284023/191537119-aa8036b3-90c4-403a-a2dc-40f1f2143f9b.jpg" width=500 alt="Participant view while reviewing an answer"><br>
Participants' answers are highlighted and can be changed until the timer either runs out or is manually stopped by the host. On timer expiry, participant answers remain highlighted, the incorrect answers' backgrounds are changed to red, and a graph showing the percentage of participants who gave each answer is displayed.


## Optimizations and Extensions
Were this to be further developed to scale beyond single workshop sessions, I would implement the ability to have multiple rooms so multiple quizzes could be taken concurrently, since at the moment, there is only a single instance of the questions running on the server at any given time. I would also implement an authentication system so that participants could keep track of the quizzes they have taken/are able to take, and so that admins could add/edit more quizzes.
