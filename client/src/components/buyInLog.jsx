import React, {Component} from "react";
export default class BuyInLog extends Component {
    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    handleKeyDown(e) {
        // esc key
        if (e.keyCode === 27) {
            e.stopPropagation();
            this.props.onClose(e);
        }
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.width === "100%" && this.props.width !== prevProps.width) {
            document.addEventListener('keydown', this.handleKeyDown);
        } else if (this.props.width !== "100%" && this.props.width !== prevProps.width) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
    }
    render() {
        return (
            <div id="buyin-log" className="overlay" style={{width: this.props.width}}>
                <a onClick={this.props.onClose} className="closebtn" id="closeBuyin">&times;</a>
                <div className="overlay-content">
                    <div className="h"><h2>Buy-ins</h2></div>
                    <BuyIns data={this.props.buyInData}/>
                </div>
            </div>
        );
    }
}

export function BuyIns({data}) {
    // $('#buyins').empty();
    let buyIns = [];
    for (let i = data.length - 1; i > -1; i--) {
        let datastr = `${data[i].playerName} (id: ${data[i].playerid}) buy-in: ${data[i].buyin}`;
        if (data[i].buyout != null){
            datastr += ` buy-out: ${data[i].buyout}`
        }
        buyIns.push((
            <p key={i}><span className='info'>{data[i].time} ~</span> {datastr}</p>
        ));
        // $('#buyins').prepend(`<p>${datastr}</p>`);
    }
    return (
        <div id="buyins">
            {buyIns}
        </div>
    );
}