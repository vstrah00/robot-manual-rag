# Classroom Rover — Fictional Educational Robot Manual

This fictional manual is sample data for a technical assignment. It does not describe a real product.

## 1. Robot overview

Classroom Rover is a small educational robot for learning how sensors, motors, and programs work together. Its controller reads sensor measurements and follows the instructions in a student program. The robot includes two driven wheels, an ultrasonic distance sensor, a downward-facing line sensor, and a rechargeable battery pack. Use it on a clear, level floor in a supervised classroom activity.

## 2. Ultrasonic distance sensor

The ultrasonic sensor measures distance by sending out a sound pulse and listening for its reflection from an object. The controller estimates distance using the time between sending the pulse and receiving the echo. A program can use this measurement to stop the robot before an obstacle. Soft, angled, or very small objects may produce unreliable reflections, so the sensor must not be treated as a guarantee against collisions. This manual does not specify its maximum range.

## 3. Line sensor

The downward-facing line sensor measures reflected light from the floor. A dark line and a light background can produce different readings, allowing a program to detect a marked path. Students should compare readings over the line and the background before choosing a detection threshold. Changes in room lighting or floor material can affect the readings and may require recalibration.

## 4. Motors and movement

Two electric motors turn the left and right wheels. Driving both wheels forward at similar speeds moves the robot approximately straight ahead. Driving one wheel faster than the other makes the robot turn. A motor driver receives commands from the controller and supplies power to the motors. Start movement experiments at low speed and keep fingers, hair, and loose clothing away from the wheels and other moving parts.

## 5. Battery handling

The rechargeable battery pack supplies power to the controller, sensors, and motors. Switch off the robot before connecting or disconnecting the battery. Keep the battery and its connectors dry, and do not short the terminals, open the pack, or use a visibly damaged battery. If the battery becomes unusually hot, swollen, or damaged, stop the activity and notify the teacher. Battery capacity, chemistry, and operating voltage are not specified in this manual.

## 6. Battery charging and storage

Charging is supervised by the teacher and uses only the charger designated for the robot's battery pack. Follow the battery and charger manufacturers' instructions for charging and storage. Do not leave charging batteries unattended. Switch off the robot after the activity and have the teacher place the battery in the designated storage location. This manual does not specify a charging duration or a connector pinout.

## 7. Classroom safety

Before running a program, clear the operating area of bags, cables, and loose objects and tell nearby students that the robot is about to move. Keep the robot on the floor and away from stairs, table edges, liquids, and crowded walkways. A teacher should supervise activities and identify the power switch before the first run. If movement becomes unexpected, stop the activity and switch off the robot when it is safe to reach the switch. Do not rely on an obstacle-detection program as the only safety measure.

## 8. Basic programming

A robot program typically repeats three steps: read sensors, make a decision, and send motor commands. For obstacle avoidance, a student can read the ultrasonic measurement and stop the motors when an obstacle is closer than a chosen classroom test threshold. For line following, the program compares line-sensor readings with a calibrated threshold and adjusts wheel speeds. Check the logic with the teacher, then test short programs at low speed in the cleared area. This manual does not prescribe a programming language or provide an SDK API.

## 9. Connections and maintenance

Turn off the robot before checking sensor cables or motor connections. Ask the teacher to inspect loose connectors rather than forcing a plug into place. Keep the sensor faces clean and unobstructed using the cleaning method approved by the teacher for the classroom equipment. Do not modify wiring or connect accessories without approval. After each activity, check for loose parts and report damage before the robot is used again.

## 10. Troubleshooting

If the robot does not move, switch it off and ask the teacher to check the battery connection and motor cables, then review whether the program actually sends a movement command. If distance readings seem inconsistent, check for obstructions in front of the ultrasonic sensor and try a broad, flat target in the cleared test area. If line following fails, compare readings over the line and background and recalibrate the detection threshold. Stop testing if there is unusual heat, visible damage, or unexpected mechanical behavior.
